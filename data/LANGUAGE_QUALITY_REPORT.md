# Language / Grammar / Clarity Quality Pass — Report

Generated: 2026-05-17T03:13:31.622Z
Mode: WRITE (auto-fixes applied)

## Summary

* Files audited:                **603**
* Files modified (auto-fix applied): **217**
* Files skipped (parse/eval error):  **0**
* Total items audited:           **16650**

### Auto-fixes by category

* Spelling fixes:           0
* Contraction repairs:      0
* Double-space collapses:   0
* Leading/trailing trims:   0
* Trailing-period strips:   0
* Aliases padded:           1592
* **Total auto-fixes:**     **1592**

### Flags for human review (not auto-fixed)

* `explanation-too-verbose`: 8494
* `explanation-too-terse`: 800
* `prompt-missing-end-punct`: 607
* `final-explanation-too-verbose`: 394
* `prompt-too-verbose`: 160
* `choices-length-variance`: 99
* `explanation-missing-end-punct`: 73
* `prompt-too-terse`: 66
* `clue-too-terse`: 24
* `final-explanation-too-terse`: 24
* `final-clue-too-verbose`: 4

---

## Skipped files (could not parse/eval)

_(none — every file parsed cleanly)_

---

## Per-file flags

Only files with ≥1 flag are listed. Each flag shows kind + location + sample.

### `assets/shared-question-bank.js` — 259 flag(s), 325 items audited

* **explanation-too-verbose** (172)
  * algebra-2.q[0] id=algebra-2-194 — 658 chars (>500) · sample: `An average rate of change comparison contrasts how fast two functions grow on a `
  * algebra-2.q[50] id=algebra-2-074 — 610 chars (>500) · sample: `The common logarithm is log base 10, abbreviated log(x) (F-BF.5). log(100)=2, lo`
  * algebra-2.q[100] id=algebra-2-167 — 590 chars (>500) · sample: `A quadratic model y=ax²+bx+c fits parabolic data (F-LE.1, F-IF.7a). Recognize fr`
  * algebra-2.q[150] id=algebra-2-060 — 517 chars (>500) · sample: `A rational exponent m/n is defined as ⁿ√(x^m) = (ⁿ√x)^m (N-RN.1). Examples: x^(1`
  * ap-biology.q[0] id=ap-biology-095 — 765 chars (>500) · sample: `Intrinsic (mitochondrial) apoptosis is governed by Bcl-2 family proteins: pro-ap`
  * ap-biology.q[53] id=ap-biology-222 — 714 chars (>500) · sample: `Homeostasis (Bernard 1865 'milieu intérieur'; Cannon 1929 coined term) — mainten`
  * ap-biology.q[106] id=ap-biology-070 — 647 chars (>500) · sample: `Glycolysis produces cytosolic NADH, but the inner mitochondrial membrane is impe`
  * ap-biology.q[159] id=ap-biology-025 — 547 chars (>500) · sample: `DNA wraps 1.65 turns (147 bp) around an octamer of histones H2A, H2B, H3, H4 (tw`
  * ... and 164 more
* **prompt-missing-end-punct** (13)
  * ap-african-american-studies.q[0] id=ap-african-american-studies-pe-005 · sample: `de was distinctive primarily because it:`
  * ap-african-american-studies.q[8] id=ap-african-american-studies-pe-004 · sample: `, and Mogadishu) are best understood as:`
  * ap-african-american-studies.q[16] id=ap-african-american-studies-pe-015 · sample: `ost significant historically because it:`
  * ap-african-american-studies.q[32] id=ap-african-american-studies-pe-037 · sample: `is historically significant because she:`
  * ap-french-language-and-culture.q[168] id=ap-french-language-and-culture-pe-012 · sample: `e française, est célèbre parce qu'elle :`
  * ap-human-geography.q[168] id=ap-human-geography-pe-014 · sample: `itions into a new hybrid is best called:`
  * ap-italian-language-and-culture.q[21] id=ap-italian-language-and-culture-pe-020 · sample: ` 'questione meridionale' si riferisce a:`
  * ap-microeconomics.q[136] id=ap-microeconomics-pe-001 · sample: `nomic problem because it arises whenever`
  * ... and 5 more
* **choices-length-variance** (8)
  * ap-african-american-studies.q[0] id=ap-african-american-studies-pe-005 — min=39, max=156, ratio=4.0
  * ap-african-american-studies.q[8] id=ap-african-american-studies-pe-004 — min=36, max=162, ratio=4.5
  * ap-african-american-studies.q[16] id=ap-african-american-studies-pe-015 — min=38, max=216, ratio=5.7
  * ap-african-american-studies.q[24] id=ap-african-american-studies-pe-022 — min=29, max=238, ratio=8.2
  * ap-african-american-studies.q[32] id=ap-african-american-studies-pe-037 — min=28, max=225, ratio=8.0
  * ap-italian-language-and-culture.q[0] id=ap-italian-language-and-culture-pe-006 — min=21, max=96, ratio=4.6
  * ap-physics-c-mechanics.q[44] id=ap-physics-c-mechanics-057 — min=12, max=52, ratio=4.3
  * precalculus.q[138] id=precalculus-033 — min=7, max=78, ratio=11.1
* **prompt-too-verbose** (7)
  * ap-african-american-studies.q[16] id=ap-african-american-studies-pe-015 — 489 chars (>300) · sample: `Read the following excerpt from Frederick Douglass's 1845 Narrative of the Life `
  * ela-11.q[138] id=ela-11-pe-021 — 334 chars (>300) · sample: `Read this paragraph:

'When demand for cheap fast fashion soared in the 2000s, g`
  * ela-5.q[114] id=ela-5-pe-009 — 584 chars (>300) · sample: `Read the fable, then answer the question.

"The Ant and the Grasshopper" (a rete`
  * ela-6.q[6] id=ela-6-pe-015 — 858 chars (>300) · sample: `Why Octopuses Are Smarter Than You Think\n\nMost people picture an octopus as a `
  * ela-6.q[12] id=ela-6-pe-014 — 916 chars (>300) · sample: `Why Octopuses Are Smarter Than You Think\n\nMost people picture an octopus as a `
  * ela-6.q[18] id=ela-6-pe-004 — 733 chars (>300) · sample: `The Lighthouse Keeper's Daughter\n\nMira had counted the same forty-seven steps `
  * ela-6.q[24] id=ela-6-pe-010 — 667 chars (>300) · sample: `The Race at Coyote Ridge\n\nDiego had trained for the Coyote Ridge cross-country`
* **prompt-too-terse** (44)
  * ap-art-history.q[0] id=ap-art-history-216 — 21 chars (<30) · sample: `Aboriginal cosmology.`
  * ap-art-history.q[61] id=ap-art-history-183 — 27 chars (<30) · sample: `Chinese landscape painting.`
  * ap-art-history.q[122] id=ap-art-history-187 — 21 chars (<30) · sample: `Hokusai's wave print.`
  * ap-art-history.q[183] id=ap-art-history-221 — 25 chars (<30) · sample: `Materials in Pacific art.`
  * ap-art-history.q[244] id=ap-art-history-194 — 25 chars (<30) · sample: `Indonesian shadow puppet.`
  * ap-calculus-ab.q[0] id=ap-calculus-ab-128 — 27 chars (<30) · sample: `Antiderivative of 1 over x.`
  * ap-calculus-bc.q[232] id=ap-calculus-bc-040 — 19 chars (<30) · sample: `d/dx of cosecant x.`
  * ap-comparative-government-and-politics.q[0] id=ap-comparative-government-and-politics-043 — 25 chars (<30) · sample: `Career-based bureaucracy.`
  * ... and 36 more
* **explanation-too-terse** (15)
  * ap-comparative-government-and-politics.q[0] id=ap-comparative-government-and-politics-043 — 19 chars (<20) · sample: `AP Comp Gov Unit 2.`
  * ap-comparative-government-and-politics.q[35] id=ap-comparative-government-and-politics-107 — 19 chars (<20) · sample: `AP Comp Gov Unit 5.`
  * ap-comparative-government-and-politics.q[70] id=ap-comparative-government-and-politics-071 — 19 chars (<20) · sample: `AP Comp Gov Unit 3.`
  * ap-comparative-government-and-politics.q[105] id=ap-comparative-government-and-politics-083 — 19 chars (<20) · sample: `AP Comp Gov Unit 4.`
  * ap-computer-science-a.q[0] id=ap-computer-science-a-190 — 14 chars (<20) · sample: `AP CSA Unit 8.`
  * ap-computer-science-a.q[59] id=ap-computer-science-a-155 — 14 chars (<20) · sample: `AP CSA Unit 7.`
  * ap-computer-science-a.q[118] id=ap-computer-science-a-111 — 14 chars (<20) · sample: `AP CSA Unit 5.`
  * ap-computer-science-a.q[177] id=ap-computer-science-a-022 — 14 chars (<20) · sample: `AP CSA Unit 1.`
  * ... and 7 more

### `games/ap-eng-lit-practice/practice-exam.html` — 81 flag(s), 45 items audited

* **prompt-too-verbose** (45)
  * q[0] id=apenglit-001 — 968 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * q[1] id=apenglit-002 — 1030 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * q[2] id=apenglit-003 — 1012 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * q[3] id=apenglit-004 — 917 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * q[4] id=apenglit-005 — 923 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * q[5] id=apenglit-006 — 935 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * q[6] id=apenglit-007 — 969 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * q[7] id=apenglit-008 — 942 chars (>300) · sample: `Pride and Prejudice, Jane Austen (1813), opening of Chapter 1:

"It is a truth u`
  * ... and 37 more
* **prompt-missing-end-punct** (36)
  * q[0] id=apenglit-001 · sample: ` acknowledged...") is best described as:`
  * q[1] id=apenglit-002 · sample: `rator views marriage in this society as:`
  * q[2] id=apenglit-003 · sample: `ing it.") primarily characterize him as:`
  * q[4] id=apenglit-005 · sample: `ced first sentence functions chiefly to:`
  * q[5] id=apenglit-006 · sample: `Mr. and Mrs. Bennet primarily serves to:`
  * q[7] id=apenglit-008 · sample: `ough" in the final line is best read as:`
  * q[8] id=apenglit-009 · sample: `ut the passage can best be described as:`
  * q[9] id=apenglit-010 · sample: `l conceit of the stanza is built around:`
  * ... and 28 more

### `games/ap-aas-practice/practice-exam.html` — 64 flag(s), 40 items audited

* **prompt-missing-end-punct** (30)
  * q[2] id=apaas-003 · sample: `re-colonial Africa primarily because it:`
  * q[3] id=apaas-004 · sample: `, and Mogadishu) are best understood as:`
  * q[4] id=apaas-005 · sample: `de was distinctive primarily because it:`
  * q[7] id=apaas-008 · sample: `ically significant primarily because it:`
  * q[8] id=apaas-009 · sample: `South Carolina is best characterized as:`
  * q[9] id=apaas-010 · sample: `rically important primarily because she:`
  * q[10] id=apaas-011 · sample: `obal slave systems primarily because it:`
  * q[11] id=apaas-012 · sample: `rm 'gens de couleur libres' referred to:`
  * ... and 22 more
* **choices-length-variance** (32)
  * q[3] id=apaas-004 — min=36, max=162, ratio=4.5
  * q[4] id=apaas-005 — min=39, max=156, ratio=4.0
  * q[7] id=apaas-008 — min=40, max=186, ratio=4.7
  * q[8] id=apaas-009 — min=47, max=230, ratio=4.9
  * q[9] id=apaas-010 — min=43, max=232, ratio=5.4
  * q[10] id=apaas-011 — min=42, max=211, ratio=5.0
  * q[11] id=apaas-012 — min=33, max=180, ratio=5.5
  * q[12] id=apaas-013 — min=48, max=221, ratio=4.6
  * ... and 24 more
* **prompt-too-verbose** (2)
  * q[14] id=apaas-015 — 489 chars (>300) · sample: `Read the following excerpt from Frederick Douglass's 1845 Narrative of the Life `
  * q[23] id=apaas-024 — 396 chars (>300) · sample: `Read the following excerpt from W. E. B. Du Bois's The Souls of Black Folk (1903`

### `games/grade-8-ela-practice/practice-exam.html` — 60 flag(s), 35 items audited

* **prompt-too-verbose** (25)
  * q[0] id=g8ela-001 — 1850 chars (>300) · sample: `<p><strong>Passage 1 — Literature.</strong> The following is an original short s`
  * q[1] id=g8ela-002 — 1868 chars (>300) · sample: `<p><strong>Passage 1 — Literature.</strong> The following is an original short s`
  * q[2] id=g8ela-003 — 1907 chars (>300) · sample: `<p><strong>Passage 1 — Literature.</strong> The following is an original short s`
  * q[3] id=g8ela-004 — 1952 chars (>300) · sample: `<p><strong>Passage 1 — Literature.</strong> The following is an original short s`
  * q[4] id=g8ela-005 — 1713 chars (>300) · sample: `<p><strong>Passage 2 — Literature.</strong> The following is an excerpt from an `
  * q[5] id=g8ela-006 — 1639 chars (>300) · sample: `<p><strong>Passage 2 — Literature.</strong> The following is an excerpt from an `
  * q[6] id=g8ela-007 — 1656 chars (>300) · sample: `<p><strong>Passage 2 — Literature.</strong> The following is an excerpt from an `
  * q[7] id=g8ela-008 — 1666 chars (>300) · sample: `<p><strong>Passage 2 — Literature.</strong> The following is an excerpt from an `
  * ... and 17 more
* **prompt-missing-end-punct** (28)
  * q[0] id=g8ela-001 · sample: ` theme developed across the passage?</p>`
  * q[1] id=g8ela-002 · sample: `hat Mara is changing as a character?</p>`
  * q[2] id=g8ela-003 · sample: ` be saving it for some braver girl"?</p>`
  * q[3] id=g8ela-004 · sample: ` structural effect of this sentence?</p>`
  * q[4] id=g8ela-005 · sample: ` reader's understanding of Halloran?</p>`
  * q[5] id=g8ela-006 · sample: `ost likely functions as a symbol of:</p>`
  * q[6] id=g8ela-007 · sample: `heme the closing paragraph develops?</p>`
  * q[7] id=g8ela-008 · sample: `d the unfinished book in the parlor?</p>`
  * ... and 20 more
* **choices-length-variance** (6)
  * q[14] id=g8ela-015 — min=43, max=216, ratio=5.0
  * q[19] id=g8ela-020 — min=25, max=253, ratio=10.1
  * q[20] id=g8ela-021 — min=33, max=232, ratio=7.0
  * q[21] id=g8ela-022 — min=33, max=148, ratio=4.5
  * q[22] id=g8ela-023 — min=39, max=210, ratio=5.4
  * q[33] id=g8ela-034 — min=50, max=210, ratio=4.2
* **explanation-missing-end-punct** (1)
  * q[26] id=g8ela-027 · sample: `e…' followed by the conditional 'would.'`

### `games/ap-micro-practice/practice-exam.html` — 40 flag(s), 40 items audited

* **prompt-missing-end-punct** (36)
  * q[0] id=apmicro-001 · sample: `nomic problem because it arises whenever`
  * q[1] id=apmicro-002 · sample: `udy, the opportunity cost of studying is`
  * q[2] id=apmicro-003 · sample: `) bowed outward from the origin reflects`
  * q[4] id=apmicro-005 · sample: `ng additional units of a good as long as`
  * q[6] id=apmicro-007 · sample: `ket for leather handbags will experience`
  * q[7] id=apmicro-008 · sample: `ent. The most likely short-run result is`
  * q[8] id=apmicro-009 · sample: `ce elasticity of demand is approximately`
  * q[9] id=apmicro-010 · sample: `ative 1.4, the two goods are most likely`
  * ... and 28 more
* **choices-length-variance** (2)
  * q[21] id=apmicro-022 — min=21, max=107, ratio=5.1
  * q[23] id=apmicro-024 — min=18, max=77, ratio=4.3
* **prompt-too-verbose** (1)
  * q[26] id=apmicro-027 — 303 chars (>300) · sample: `Two firms in a duopoly each must choose to charge a high price or a low price. I`
* **prompt-too-terse** (1)
  * q[31] id=apmicro-032 — 29 chars (<30) · sample: `A monopsony in a labor market`

### `games/apush-practice/practice-exam.html` — 37 flag(s), 45 items audited

* **prompt-missing-end-punct** (37)
  * q[1] id=apush-002 · sample: `he is criticizing is best identified as:`
  * q[4] id=apush-005 · sample: `.' This rhetoric most directly reflects:`
  * q[5] id=apush-006 · sample: `are best understood as an expression of:`
  * q[6] id=apush-007 · sample: `o issue the Proclamation of 1763, which:`
  * q[7] id=apush-008 · sample: `rge Whitefield were central features of:`
  * q[8] id=apush-009 · sample: `complaint most directly responds to the:`
  * q[9] id=apush-010 · sample: `political effect on the colonies was to:`
  * q[10] id=apush-011 · sample: `rectly persuaded political leaders that:`
  * ... and 29 more

### `games/ap-french-practice/practice-exam.html` — 33 flag(s), 40 items audited

* **prompt-too-verbose** (12)
  * q[0] id=apfrench-001 — 429 chars (>300) · sample: `Lisez le courriel suivant.

"Chère Maman, ici à Montréal tout se passe bien. Mes`
  * q[3] id=apfrench-004 — 403 chars (>300) · sample: `Lisez la note suivante affichée dans un immeuble parisien.

« Avis aux résidents`
  * q[8] id=apfrench-009 — 532 chars (>300) · sample: `Lisez le passage suivant.

« La France a fait le choix politique du nucléaire ci`
  * q[10] id=apfrench-011 — 379 chars (>300) · sample: `Lisez le tweet suivant publié par un chercheur français.

« Notre nouvelle étude`
  * q[13] id=apfrench-014 — 401 chars (>300) · sample: `Lisez l'annonce suivante.

« Café Le Procope — Saint-Germain-des-Prés. Venez pre`
  * q[20] id=apfrench-021 — 466 chars (>300) · sample: `Lisez l'extrait d'article suivant.

« La laïcité, principe fondamental de la Rép`
  * q[23] id=apfrench-024 — 409 chars (>300) · sample: `Lisez le commentaire suivant publié sur un forum francophone.

« Je suis née à L`
  * q[26] id=apfrench-027 — 521 chars (>300) · sample: `Lisez le passage suivant tiré d'une brochure de musée.

« Claude Monet, peintre `
  * ... and 4 more
* **prompt-missing-end-punct** (20)
  * q[1] id=apfrench-002 · sample: `terme « la famille nucléaire » désigne :`
  * q[5] id=apfrench-006 · sample: `ite à nos grands-parents plus souvent. »`
  * q[10] id=apfrench-011 · sample: `»

Le chercheur exprime principalement :`
  * q[11] id=apfrench-012 · sample: `e française, est célèbre parce qu'elle :`
  * q[12] id=apfrench-013 · sample: `antage dans la recherche scientifique. »`
  * q[14] id=apfrench-015 · sample: `Le Tour de France est :`
  * q[16] id=apfrench-017 · sample: ` et un café au lait au petit-déjeuner. »`
  * q[19] id=apfrench-020 · sample: `cenciés et l'attention médiatique, est :`
  * ... and 12 more
* **prompt-too-terse** (1)
  * q[14] id=apfrench-015 — 23 chars (<30) · sample: `Le Tour de France est :`

### `games/ap-spanish-lit-practice/practice-exam.html` — 32 flag(s), 40 items audited

* **prompt-missing-end-punct** (23)
  * q[3] id=apspanlit-004 · sample: `funciona principalmente como recurso de:`
  * q[5] id=apspanlit-006 · sample: `Salamanca marca un momento clave porque:`
  * q[6] id=apspanlit-007 · sample: ` tono predominante de este desenlace es:`
  * q[7] id=apspanlit-008 · sample: `rtido en el emblema de la novela porque:`
  * q[8] id=apspanlit-009 · sample: `mental en Don Quijote porque representa:`
  * q[9] id=apspanlit-010 · sample: `. Este recurso metaliterario sirve para:`
  * q[10] id=apspanlit-011 · sample: `finitivamente condenado al infierno por:`
  * q[11] id=apspanlit-012 · sample: `lla principalmente el tópico clásico de:`
  * ... and 15 more
* **choices-length-variance** (9)
  * q[8] id=apspanlit-009 — min=27, max=128, ratio=4.7
  * q[10] id=apspanlit-011 — min=27, max=118, ratio=4.4
  * q[18] id=apspanlit-019 — min=17, max=83, ratio=4.9
  * q[24] id=apspanlit-025 — min=27, max=119, ratio=4.4
  * q[26] id=apspanlit-027 — min=29, max=122, ratio=4.2
  * q[30] id=apspanlit-031 — min=29, max=132, ratio=4.6
  * q[33] id=apspanlit-034 — min=25, max=156, ratio=6.2
  * q[34] id=apspanlit-035 — min=27, max=116, ratio=4.3
  * ... and 1 more

### `games/ap-english-language/99 - Cumulative Yearlong Jeopardy Review.html` — 31 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 753 chars · sample: `Logos, the Aristotelian appeal to logic from 'Rhetoric' (4th c. BCE), persuades `
  * cat[0].clue[1] (value 200) — 664 chars · sample: `Pathos, the Aristotelian appeal to emotion from 'Rhetoric' (Book II, 4th c. BCE)`
  * cat[0].clue[2] (value 300) — 698 chars · sample: `Ethos, the Aristotelian appeal to credibility from 'Rhetoric' (Book I, 4th c. BC`
  * cat[0].clue[3] (value 400) — 726 chars · sample: `Kairos is the classical Greek rhetorical concept of the right or opportune momen`
  * cat[0].clue[4] (value 500) — 707 chars · sample: `Aristotle (384-322 BCE), Greek philosopher and student of Plato, systematized th`
  * cat[1].clue[0] (value 100) — 731 chars · sample: `Metaphor is a comparison without 'like' or 'as' - an implicit identification bet`
  * cat[1].clue[1] (value 200) — 706 chars · sample: `Simile is a comparison using 'like' or 'as' - the explicit counterpart to metaph`
  * cat[1].clue[2] (value 300) — 693 chars · sample: `Anaphora is the repetition of the same word or phrase at the beginning of succes`
  * ... and 17 more
* **clue-too-terse** (4)
  * cat[2].clue[0] (value 100) — 11 chars · sample: `Main claim.`
  * cat[4].clue[0] (value 100) — 11 chars · sample: `FRQ 1 type.`
  * cat[4].clue[1] (value 200) — 11 chars · sample: `FRQ 2 type.`
  * cat[4].clue[2] (value 300) — 11 chars · sample: `FRQ 3 type.`
* **explanation-missing-end-punct** (1)
  * cat[3].clue[3] (value 400) · sample: ` 'the author uses descriptive language.'`
* **final-explanation-too-verbose** (1)
  * final — 1139 chars

### `games/ap-statistics/06 - Inference for Proportions Jeopardy Review.html` — 31 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 685 chars · sample: `A confidence interval (CI) is an interval estimate of a population parameter wit`
  * cat[0].clue[1] (value 200) — 583 chars · sample: `z* = 1.96 is the critical value for a 95 percent Normal-based confidence interva`
  * cat[0].clue[2] (value 300) — 579 chars · sample: `The one-proportion CI formula is p-hat plus or minus z*-times-sqrt(p-hat*(1-p-ha`
  * cat[0].clue[3] (value 400) — 590 chars · sample: `The width of a confidence interval doubles when the standard error doubles - all`
  * cat[0].clue[4] (value 500) — 610 chars · sample: `To halve the margin of error of a confidence interval, sample size must be QUADR`
  * cat[1].clue[0] (value 100) — 623 chars · sample: `The one-proportion z-test tests the null hypothesis H0: p = p0 against an altern`
  * cat[1].clue[1] (value 200) — 583 chars · sample: `The null hypothesis in a one-proportion test has the form H0: p = p0, where p0 i`
  * cat[1].clue[2] (value 300) — 543 chars · sample: `The test statistic for a one-proportion z-test is z = (p-hat - p0)/sqrt(p0*(1-p0`
  * ... and 17 more
* **explanation-missing-end-punct** (5)
  * cat[0].clue[0] (value 100) · sample: ` proportion is between 0.504 and 0.696.'`
  * cat[1].clue[1] (value 200) · sample: ` the true defect rate equals 5 percent.'`
  * cat[2].clue[1] (value 200) · sample: `rates in the two populations are equal.'`
  * cat[2].clue[3] (value 400) · sample: `tween 1.17 and 18.83 percentage points.'`
  * cat[3].clue[2] (value 300) · sample: `cting real effects, not just '1 - beta.'`
* **final-explanation-too-verbose** (1)
  * final — 708 chars

### `games/ap-eng-lang-practice/practice-exam.html` — 30 flag(s), 45 items audited

* **prompt-too-verbose** (8)
  * q[0] id=apenglang-001 — 439 chars (>300) · sample: `PASSAGE A: "The public library is the last building in town that asks nothing of`
  * q[6] id=apenglang-007 — 311 chars (>300) · sample: `PASSAGE B: "Four score and seven years ago our fathers brought forth on this con`
  * q[12] id=apenglang-013 — 397 chars (>300) · sample: `PASSAGE C: "Every notification is a small, polite demand. Considered one at a ti`
  * q[18] id=apenglang-019 — 303 chars (>300) · sample: `PASSAGE D: "What, to the American slave, is your 4th of July? I answer: a day th`
  * q[24] id=apenglang-025 — 406 chars (>300) · sample: `PASSAGE E: "Critics dismiss the neighborhood garden as a hobby for those who can`
  * q[35] id=apenglang-036 — 316 chars (>300) · sample: `WRITING: A formal research essay on climate policy contains the sentence: "Scien`
  * q[42] id=apenglang-043 — 421 chars (>300) · sample: `WRITING: A student's introductory paragraph contains the following four sentence`
  * q[44] id=apenglang-045 — 426 chars (>300) · sample: `WRITING: A paragraph defends the value of close reading. Which sentence, if inse`
* **prompt-missing-end-punct** (19)
  * q[2] id=apenglang-003 · sample: `ct of resistance") serves primarily to —`
  * q[3] id=apenglang-004 · sample: ` you linger over" functions chiefly as —`
  * q[4] id=apenglang-005 · sample: `e passage is most clearly addressed to —`
  * q[6] id=apenglang-007 · sample: `seven years ago" most likely serves to —`
  * q[8] id=apenglang-009 · sample: ` primary purpose in this closing is to —`
  * q[9] id=apenglang-010 · sample: `its persuasive power primarily through —`
  * q[12] id=apenglang-013 · sample: `'s central claim is best summarized as —`
  * q[13] id=apenglang-014 · sample: `sidered together" functions chiefly to —`
  * ... and 11 more
* **choices-length-variance** (2)
  * q[31] id=apenglang-032 — min=3, max=105, ratio=35.0
  * q[41] id=apenglang-042 — min=19, max=91, ratio=4.8
* **explanation-missing-end-punct** (1)
  * q[37] id=apenglang-038 · sample: `uld also use a comma before 'including.'`

### `games/ap-spanish-lang-practice/practice-exam.html` — 30 flag(s), 40 items audited

* **prompt-too-verbose** (4)
  * q[1] id=apspanlang-002 — 315 chars (>300) · sample: `Lee el siguiente fragmento de un correo electrónico:

«Querida abuela, te escrib`
  * q[7] id=apspanlang-008 — 341 chars (>300) · sample: `Lee el siguiente fragmento de un artículo:

«Según un estudio reciente, más del `
  * q[28] id=apspanlang-029 — 318 chars (>300) · sample: `Lee este breve fragmento ficticio inspirado en el género de la novela picaresca `
  * q[33] id=apspanlang-034 — 335 chars (>300) · sample: `Lee el siguiente fragmento ficticio de una carta abierta:

«Cada día miles de pe`
* **prompt-missing-end-punct** (25)
  * q[3] id=apspanlang-004 · sample: `das y te diré quién eres» significa que:`
  * q[4] id=apspanlang-005 · sample: `onales, las familias hispanas tienden a:`
  * q[5] id=apspanlang-006 · sample: `mi, Florida, proviene principalmente de:`
  * q[8] id=apspanlang-009 · sample: `gico, la palabra «la nube» se refiere a:`
  * q[9] id=apspanlang-010 · sample: `considerado pionero en el desarrollo de:`
  * q[12] id=apspanlang-013 · sample: `acciones tienen como objetivo principal:`
  * q[13] id=apspanlang-014 · sample: ` de Texas tiene como objetivo principal:`
  * q[14] id=apspanlang-015 · sample: `nciana puede esperar un plato a base de:`
  * ... and 17 more
* **choices-length-variance** (1)
  * q[34] id=apspanlang-035 — min=36, max=148, ratio=4.1

### `games/grade-8-ela/06 - Writing: Narrative and Informative Jeopardy Review.html` — 29 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 603 chars · sample: `A narrative is a story told from a chosen perspective, typically with characters`
  * cat[0].clue[1] (value 200) — 610 chars · sample: `Dialogue is the spoken exchange between characters in a narrative, used to revea`
  * cat[0].clue[2] (value 300) — 589 chars · sample: `Descriptive details—often sensory (sight, sound, touch, taste, smell)—create viv`
  * cat[0].clue[3] (value 400) — 541 chars · sample: `Plot structure organizes narrative events with a clear beginning (exposition, in`
  * cat[0].clue[4] (value 500) — 588 chars · sample: `Internal monologue (or interior monologue) is a character's private thoughts rev`
  * cat[1].clue[0] (value 100) — 571 chars · sample: `Point-of-view selection in narrative writing determines whose mind the reader en`
  * cat[1].clue[1] (value 200) — 567 chars · sample: `Sequence transitions—'first,' 'next,' 'then,' 'meanwhile,' 'finally,' 'afterward`
  * cat[1].clue[2] (value 300) — 590 chars · sample: `A flashback is a scene set in time before the narrative's present, providing bac`
  * ... and 17 more
* **explanation-missing-end-punct** (3)
  * cat[2].clue[2] (value 300) · sample: `ch plants convert sunlight into energy.'`
  * cat[2].clue[4] (value 500) · sample: ` to ship goods only on British vessels.'`
  * cat[4].clue[2] (value 300) · sample: `' before asking 'is my grammar correct?'`
* **final-explanation-too-verbose** (1)
  * final — 769 chars

### `games/ap-comp-gov-practice/practice-exam.html` — 29 flag(s), 40 items audited

* **prompt-missing-end-punct** (20)
  * q[7] id=apcompgov-008 · sample: `primarily because a totalitarian regime:`
  * q[9] id=apcompgov-010 · sample: `ad of government is best illustrated by:`
  * q[13] id=apcompgov-014 · sample: `residential' system because it features:`
  * q[14] id=apcompgov-015 · sample: `reaucracy, is most directly designed to:`
  * q[15] id=apcompgov-016 · sample: `l power because it has the authority to:`
  * q[16] id=apcompgov-017 · sample: `eligion, and media is best described as:`
  * q[17] id=apcompgov-018 · sample: `ciety in China is best characterized as:`
  * q[18] id=apcompgov-019 · sample: `olice brutality, is best categorized as:`
  * ... and 12 more
* **choices-length-variance** (9)
  * q[20] id=apcompgov-021 — min=17, max=99, ratio=5.8
  * q[22] id=apcompgov-023 — min=10, max=56, ratio=5.6
  * q[25] id=apcompgov-026 — min=24, max=110, ratio=4.6
  * q[28] id=apcompgov-029 — min=22, max=110, ratio=5.0
  * q[29] id=apcompgov-030 — min=14, max=71, ratio=5.1
  * q[33] id=apcompgov-034 — min=16, max=90, ratio=5.6
  * q[34] id=apcompgov-035 — min=22, max=112, ratio=5.1
  * q[37] id=apcompgov-038 — min=19, max=97, ratio=5.1
  * ... and 1 more

### `games/ap-calculus-bc/10 - Infinite Sequences and Series Jeopardy Review.html` — 28 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 606 chars · sample: `An infinite series sum a_n converges to S if the sequence of partial sums S_n = `
  * cat[0].clue[1] (value 200) — 519 chars · sample: `Geometric series sum from n = 0 to infinity of a r^n converges iff |r| < 1, with`
  * cat[0].clue[2] (value 300) — 562 chars · sample: `nth-term Test for divergence: if lim n to infinity of a_n is NOT 0 (or fails to `
  * cat[0].clue[3] (value 400) — 570 chars · sample: `Direct Comparison Test: if 0 <= a_n <= b_n for all n large enough, and sum b_n c`
  * cat[0].clue[4] (value 500) — 519 chars · sample: `Ratio Test for sum a_n: compute L = lim n to infinity of |a_{n+1}/a_n|. If L < 1`
  * cat[1].clue[0] (value 100) — 585 chars · sample: `A power series in x centered at a is a series of the form sum from n = 0 to infi`
  * cat[1].clue[1] (value 200) — 514 chars · sample: `The INTERVAL OF CONVERGENCE of a power series sum c_n (x - a)^n is the set of x `
  * cat[1].clue[2] (value 300) — 525 chars · sample: `The radius of convergence R of a power series sum c_n (x - a)^n is the half-widt`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[1].clue[3] (value 400) · sample: `st, solve L(x) < 1 to find |x - a| < R.'`
* **clue-too-terse** (1)
  * cat[4].clue[1] (value 200) — 11 chars · sample: `Σ 1 over n.`
* **final-explanation-too-verbose** (1)
  * final — 619 chars

### `games/ap-english-language/05 - Rhetorical Appeals Jeopardy Review.html` — 28 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 710 chars · sample: `Statistics as logos strategy use hard quantitative data to support claims throug`
  * cat[0].clue[1] (value 200) — 696 chars · sample: `A reasoning chain is a step-by-step logical argument that builds from premises t`
  * cat[0].clue[2] (value 300) — 707 chars · sample: `A syllogism (Aristotle, 'Prior Analytics,' 4th c. BCE) is a three-part deductive`
  * cat[0].clue[3] (value 400) — 735 chars · sample: `Empirical evidence is evidence drawn from specific observations, experiments, or`
  * cat[0].clue[4] (value 500) — 708 chars · sample: `Sound reasoning is the absence of logical fallacies and the presence of valid lo`
  * cat[1].clue[0] (value 100) — 728 chars · sample: `An anecdote as pathos strategy is a short emotion-stirring story used to ground `
  * cat[1].clue[1] (value 200) — 676 chars · sample: `Loaded language is the use of charged words carrying strong emotional connotatio`
  * cat[1].clue[2] (value 300) — 692 chars · sample: `Imagery as pathos strategy uses sensory language to evoke emotional response - t`
  * ... and 17 more
* **explanation-missing-end-punct** (2)
  * cat[1].clue[0] (value 100) · sample: `t just label them as 'emotional appeal.'`
  * cat[1].clue[1] (value 200) · sample: ` calling diction generically 'powerful.'`
* **final-explanation-too-verbose** (1)
  * final — 1080 chars

### `games/ap-english-literature/07 - Short Fiction III Jeopardy Review.html` — 28 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 572 chars · sample: `Modernism is the literary movement (roughly 1890–1945) responding to World War I`
  * cat[0].clue[1] (value 200) — 585 chars · sample: `Fragmentation is the modernist technique of breaking narrative, syntax, and imag`
  * cat[0].clue[2] (value 300) — 555 chars · sample: `Stream of consciousness is the modernist narrative technique rendering the unstr`
  * cat[0].clue[3] (value 400) — 575 chars · sample: `Skepticism in modernism is the questioning of inherited authorities — religion, `
  * cat[0].clue[4] (value 500) — 515 chars · sample: `Alienation is the modernist sense of estrangement from self, community, history,`
  * cat[1].clue[0] (value 100) — 578 chars · sample: `Postmodernism is the literary and cultural movement following modernism (roughly`
  * cat[1].clue[1] (value 200) — 531 chars · sample: `Metafiction is postmodern fiction that draws attention to its own status as fict`
  * cat[1].clue[2] (value 300) — 545 chars · sample: `Genre hybridity is the postmodern blending of literary modes — high and low, rea`
  * ... and 17 more
* **explanation-missing-end-punct** (2)
  * cat[0].clue[1] (value 200) · sample: `agments I have shored against my ruins.'`
  * cat[4].clue[0] (value 100) · sample: `tive evidence rather than 'fancy words.'`
* **final-explanation-too-verbose** (1)
  * final — 551 chars

### `games/ap-english-literature/99 - Cumulative Yearlong Jeopardy Review.html` — 28 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 544 chars · sample: `Protagonist is the central character whose journey a narrative traces. Joyce's G`
  * cat[0].clue[1] (value 200) — 575 chars · sample: `Antagonist embodies the opposing force, person, or system that resists the prota`
  * cat[0].clue[2] (value 300) — 518 chars · sample: `Setting is the time and place of a narrative, including historical, cultural, an`
  * cat[0].clue[3] (value 400) — 533 chars · sample: `Narrator is the voice telling a story, distinct from the author. Marlow in Conra`
  * cat[0].clue[4] (value 500) — 509 chars · sample: `Theme is the underlying meaning a work conveys, distinct from subject. Achebe's `
  * cat[1].clue[0] (value 100) — 538 chars · sample: `Sonnet is a 14-line lyric in iambic pentameter, originated by Giacomo da Lentini`
  * cat[1].clue[1] (value 200) — 550 chars · sample: `Iamb is a metrical foot of one unstressed syllable followed by one stressed (u /`
  * cat[1].clue[2] (value 300) — 524 chars · sample: `Volta is the Italian word for 'turn,' the structural pivot of a sonnet. In Petra`
  * ... and 16 more
* **clue-too-terse** (3)
  * cat[4].clue[0] (value 100) — 11 chars · sample: `FRQ 1 type.`
  * cat[4].clue[1] (value 200) — 11 chars · sample: `FRQ 2 type.`
  * cat[4].clue[2] (value 300) — 11 chars · sample: `FRQ 3 type.`
* **final-explanation-too-verbose** (1)
  * final — 618 chars

### `games/grade-12-ela/04 - Reading Informational - Rhetoric Tone Purpose Jeopardy Review.html` — 28 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 769 chars · sample: `Sardonic combines scorn with bitter humor - a tone that mocks while wounded, tha`
  * cat[0].clue[1] (value 200) — 739 chars · sample: `Satirical describes a tone that uses irony, exaggeration, and ridicule to expose`
  * cat[0].clue[2] (value 300) — 713 chars · sample: `Restrained describes a tone deliberately understated, controlled, refusing the f`
  * cat[0].clue[3] (value 400) — 659 chars · sample: `Elegiac describes a tone of mournful contemplation, especially of loss, often gr`
  * cat[0].clue[4] (value 500) — 733 chars · sample: `Tentative describes a writer's tone of uncertainty, ambiguity, and provisional c`
  * cat[1].clue[0] (value 100) — 780 chars · sample: `An informational article explaining how Congress passes laws has primarily the p`
  * cat[1].clue[1] (value 200) — 724 chars · sample: `SOAPSTone is the standard rhetorical-analysis acronym: Speaker, Occasion, Audien`
  * cat[1].clue[2] (value 300) — 714 chars · sample: `A writer arguing for policy change - say, to abolish standardized testing, or to`
  * ... and 17 more
* **explanation-missing-end-punct** (2)
  * cat[0].clue[1] (value 200) · sample: `than specific 'satirical exposure of X.'`
  * cat[0].clue[3] (value 400) · sample: `bulary over generic 'sad' or 'mournful.'`
* **final-explanation-too-verbose** (1)
  * final — 1112 chars

### `games/grade-8-ela/05 - Writing: Argument Jeopardy Review.html` — 28 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 580 chars · sample: `A claim is the central assertion of an argument—a debatable position the writer `
  * cat[0].clue[1] (value 200) — 577 chars · sample: `A thesis statement is a single sentence in the introduction stating the essay's `
  * cat[0].clue[2] (value 300) — 558 chars · sample: `A factual statement asserts something verifiable that is not open to debate—'Ann`
  * cat[0].clue[3] (value 400) — 564 chars · sample: `An arguable claim is a debatable position—a statement reasonable people could di`
  * cat[0].clue[4] (value 500) — 571 chars · sample: `A conclusion claim restates the central thesis at the essay's end—sometimes word`
  * cat[1].clue[0] (value 100) — 563 chars · sample: `Textual evidence is specific information drawn from source texts—quotations, sta`
  * cat[1].clue[1] (value 200) — 554 chars · sample: `Relevant evidence directly supports the claim being made—not tangentially relate`
  * cat[1].clue[2] (value 300) — 566 chars · sample: `A direct quotation is verbatim text from the source enclosed in quotation marks,`
  * ... and 17 more
* **explanation-missing-end-punct** (2)
  * cat[3].clue[2] (value 300) · sample: ` and refutation with 'however' or 'yet.'`
  * cat[4].clue[1] (value 200) · sample: `asons why' becomes 'Many reasons exist.'`
* **final-explanation-too-verbose** (1)
  * final — 667 chars

### `games/grade-8-math/02 - Expressions and Equations Jeopardy Review.html` — 28 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 652 chars · sample: `The product-of-powers rule: when multiplying powers with the SAME base, keep the`
  * cat[0].clue[1] (value 200) — 589 chars · sample: `The quotient-of-powers rule: when dividing powers with the SAME base, keep the b`
  * cat[0].clue[2] (value 300) — 587 chars · sample: `Any nonzero number raised to the zero power equals 1: x^0 = 1 for x ≠ 0. NYS Com`
  * cat[0].clue[3] (value 400) — 639 chars · sample: `A negative exponent gives the reciprocal of the positive-exponent value: x^-n = `
  * cat[0].clue[4] (value 500) — 639 chars · sample: `The power-of-a-power rule: when raising a power to a power, keep the base and MU`
  * cat[1].clue[0] (value 100) — 727 chars · sample: `To multiply numbers in scientific notation: multiply the coefficients, ADD the e`
  * cat[1].clue[1] (value 200) — 676 chars · sample: `To divide numbers in scientific notation: divide the coefficients, SUBTRACT the `
  * cat[1].clue[2] (value 300) — 631 chars · sample: `To multiply (2 × 10^4)(3 × 10^5): multiply coefficients (2·3 = 6), add exponents`
  * ... and 17 more
* **explanation-missing-end-punct** (2)
  * cat[0].clue[1] (value 200) · sample: `ting; remember 'DIV-DIV means subtract.'`
  * cat[4].clue[0] (value 100) · sample: `orize: 'TIMES means PLUS for exponents.'`
* **final-explanation-too-verbose** (1)
  * final — 841 chars

### `games/ap-psych-practice/practice-exam.html` — 28 flag(s), 40 items audited

* **prompt-missing-end-punct** (28)
  * q[3] id=appsych-004 · sample: ` The damage is most likely localized to:`
  * q[5] id=appsych-006 · sample: ` This pattern is strongest evidence for:`
  * q[6] id=appsych-007 · sample: `lids. The participant is most likely in:`
  * q[7] id=appsych-008 · sample: `t. This phenomenon is best described as:`
  * q[12] id=appsych-013 · sample: `ry reports. This effect is best labeled:`
  * q[14] id=appsych-015 · sample: `al g-factor view because it argues that:`
  * q[15] id=appsych-016 · sample: `ly and uniformly that they must possess:`
  * q[16] id=appsych-017 · sample: `et's framework she has not yet mastered:`
  * ... and 20 more

### `games/algebra-2/08 - Modeling and Regents Strategy Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 664 chars · sample: `A linear model y=mx+b fits when data change at a constant rate (F-LE.1a). Recogn`
  * cat[0].clue[1] (value 200) — 590 chars · sample: `A quadratic model y=ax²+bx+c fits parabolic data (F-LE.1, F-IF.7a). Recognize fr`
  * cat[0].clue[2] (value 300) — 607 chars · sample: `An exponential model y=a·bˣ fits data with constant ratio between consecutive va`
  * cat[0].clue[3] (value 400) — 670 chars · sample: `A logarithmic model y=a+b·ln(x) fits data that rise quickly then plateau (F-LE.5`
  * cat[0].clue[4] (value 500) — 666 chars · sample: `A sinusoidal model y=a·sin(b(x-c))+d fits periodic data (F-TF.5). Recognize from`
  * cat[1].clue[0] (value 100) — 728 chars · sample: `A regression equation is the best-fit function for given data, computed via calc`
  * cat[1].clue[1] (value 200) — 697 chars · sample: `The correlation coefficient r measures linear association: r∈[-1,1] (S-ID.8). r=`
  * cat[1].clue[2] (value 300) — 687 chars · sample: `The coefficient of determination r² (R-squared) is the proportion of variability`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[4] (value 500) · sample: `reject negative time as not meaningful.'`
* **final-explanation-too-verbose** (1)
  * final — 840 chars

### `games/ap-calculus-ab/02 - Differentiation Basics Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 583 chars · sample: `The difference quotient (f(x+h) - f(x))/h represents the slope of the secant lin`
  * cat[0].clue[1] (value 200) — 603 chars · sample: `Gottfried Wilhelm Leibniz introduced dy/dx in his 1684 Acta Eruditorum paper 'No`
  * cat[0].clue[2] (value 300) — 550 chars · sample: `f'(a) is the slope of the tangent line to the graph of f at the point (a, f(a)) `
  * cat[0].clue[3] (value 400) — 583 chars · sample: `f is differentiable at c iff lim(h->0) (f(c+h) - f(c))/h exists as a finite real`
  * cat[0].clue[4] (value 500) — 626 chars · sample: `Differentiability implies continuity: if f'(c) exists, then lim(x->c) f(x) = f(c`
  * cat[1].clue[0] (value 100) — 563 chars · sample: `d/dx[x^n] = n x^(n-1) for any real n. Newton derived it for positive integers in`
  * cat[1].clue[1] (value 200) — 562 chars · sample: `d/dx[x] = 1 by the Power Rule with n = 1: 1 * x^0 = 1. Equivalently from the lim`
  * cat[1].clue[2] (value 300) — 550 chars · sample: `d/dx[c] = 0 for any real constant c. From the limit definition: lim(h->0) (c - c`
  * ... and 17 more
* **clue-too-terse** (1)
  * cat[1].clue[1] (value 200) — 10 chars · sample: `d/dx of x.`
* **final-explanation-too-verbose** (1)
  * final — 669 chars

### `games/ap-calculus-ab/07 - Differential Equations Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 679 chars · sample: `A differential equation (DE) relates an unknown function y(x) to its derivatives`
  * cat[0].clue[1] (value 200) — 589 chars · sample: `A separable ODE has the form dy/dx = f(x) g(y), allowing the variables to be spl`
  * cat[0].clue[2] (value 300) — 620 chars · sample: `An initial condition y(x_0) = y_0 selects a unique solution from the family para`
  * cat[0].clue[3] (value 400) — 561 chars · sample: `For dy/dt = ky with y(0) = y_0, separate variables: dy/y = k dt, integrate: ln|y`
  * cat[0].clue[4] (value 500) — 586 chars · sample: `When the ODE is dy/dx = f(x) (no y on the right side), the solution is direct: y`
  * cat[1].clue[0] (value 100) — 640 chars · sample: `A slope field (direction field) plots short line segments at grid points (x, y),`
  * cat[1].clue[1] (value 200) — 571 chars · sample: `At (1, 2) the slope is dy/dx = (1)(2) = 2 — substitute the coordinates into the `
  * cat[1].clue[2] (value 300) — 650 chars · sample: `Slope fields enable qualitative analysis of solutions even when the ODE cannot b`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[4].clue[1] (value 200) · sample: `min, rate out = Y * Q/V; write the ODE.'`
* **final-explanation-too-verbose** (1)
  * final — 608 chars

### `games/ap-calculus-bc/01 - Limits and Continuity Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 571 chars · sample: `lim x to c of f(x) = L means for every epsilon > 0 there exists delta > 0 with |`
  * cat[0].clue[1] (value 200) — 556 chars · sample: `An expression like 0/0, infty/infty, 0 times infty, infty - infty, 1^infty, 0^0,`
  * cat[0].clue[2] (value 300) — 542 chars · sample: `Published by Marquis Guillaume de L'Hopital in Analyse des Infiniment Petits (16`
  * cat[0].clue[3] (value 400) — 553 chars · sample: `If g(x) <= f(x) <= h(x) on an interval around c (except possibly at c) and lim g`
  * cat[0].clue[4] (value 500) — 552 chars · sample: `e = lim n to infty of (1 + 1/n)^n approximately 2.71828, discovered by Jacob Ber`
  * cat[1].clue[0] (value 100) — 573 chars · sample: `Cauchy's three-part definition (1821): (1) f(c) is defined, (2) lim x to c of f(`
  * cat[1].clue[1] (value 200) — 576 chars · sample: `A 'hole' in the graph: lim x to c of f(x) = L exists, but either f(c) is undefin`
  * cat[1].clue[2] (value 300) — 560 chars · sample: `Both one-sided limits exist and are finite but lim x to c^- of f(x) is not equal`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[0] (value 100) · sample: `there exists c in (a, b) with f(c) = N.'`
* **final-explanation-too-verbose** (1)
  * final — 671 chars

### `games/ap-calculus-bc/05 - Analytical Applications of Differentiation Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 565 chars · sample: `Absolute (global) maximum on [a, b] is the largest value f attains on the entire`
  * cat[0].clue[1] (value 200) — 574 chars · sample: `Absolute (global) minimum on [a, b] is the smallest value f attains on the entir`
  * cat[0].clue[2] (value 300) — 577 chars · sample: `Extreme Value Theorem (Karl Weierstrass, 1860 lectures; published posthumously):`
  * cat[0].clue[3] (value 400) — 540 chars · sample: `A critical point c is a value where either f'(c) = 0 (horizontal tangent) or f'(`
  * cat[0].clue[4] (value 500) — 537 chars · sample: `First Derivative Test for local extrema: at a critical point c where f' is defin`
  * cat[1].clue[0] (value 100) — 536 chars · sample: `f is concave up on an interval where f''(x) > 0: the graph bends upward, tangent`
  * cat[1].clue[1] (value 200) — 553 chars · sample: `f is concave down on an interval where f''(x) < 0: the graph bends downward, tan`
  * cat[1].clue[2] (value 300) — 556 chars · sample: `An inflection point is a point on the graph where concavity changes — equivalent`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[3] (value 400) · sample: `en by Rolle f' has a zero between them.'`
* **final-explanation-too-verbose** (1)
  * final — 682 chars

### `games/ap-english-language/04 - Style and Voice Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 723 chars · sample: `Diction is the writer's word choice - the selection of vocabulary that shapes me`
  * cat[0].clue[1] (value 200) — 712 chars · sample: `Formal diction uses elevated, precise, often Latinate vocabulary appropriate to `
  * cat[0].clue[2] (value 300) — 668 chars · sample: `Colloquial diction uses everyday, conversational vocabulary - the register of ca`
  * cat[0].clue[3] (value 400) — 726 chars · sample: `Jargon is the specialized vocabulary of a field or profession - terms that are p`
  * cat[0].clue[4] (value 500) — 757 chars · sample: `Archaic diction uses words and expressions no longer in common use - 'thee,' 'th`
  * cat[1].clue[0] (value 100) — 708 chars · sample: `Syntax is the arrangement of words in sentences - sentence structure, word order`
  * cat[1].clue[1] (value 200) — 702 chars · sample: `A simple sentence contains one independent clause - one subject, one main verb, `
  * cat[1].clue[2] (value 300) — 668 chars · sample: `A compound sentence joins two or more independent clauses, typically with a coor`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[4].clue[0] (value 100) · sample: ` 'the author uses descriptive language.'`
* **final-explanation-too-verbose** (1)
  * final — 1033 chars

### `games/ap-english-language/08 - Synthesis Essay Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 717 chars · sample: `Synthesis is the integration of multiple sources to support an original thesis -`
  * cat[0].clue[1] (value 200) — 670 chars · sample: `Three sources is the minimum number students must incorporate in the AP synthesi`
  * cat[0].clue[2] (value 300) — 725 chars · sample: `Multiple media in the AP synthesis FRQ (Q1) source packet refers to the variety `
  * cat[0].clue[3] (value 400) — 639 chars · sample: `In-text citation in the AP synthesis FRQ (Q1) means identifying which source a s`
  * cat[0].clue[4] (value 500) — 670 chars · sample: `A synthesis thesis is an original argument using sources rather than merely summ`
  * cat[1].clue[0] (value 100) — 768 chars · sample: `Paraphrase is restating a source's content in the student writer's own words and`
  * cat[1].clue[1] (value 200) — 712 chars · sample: `Quotation is direct copying of source language inside quotation marks, with attr`
  * cat[1].clue[2] (value 300) — 645 chars · sample: `Summary is brief restatement of a source's main idea - typically used for contex`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[2] (value 300) · sample: `a complicates the picture by showing Y.'`
* **final-explanation-too-verbose** (1)
  * final — 1112 chars

### `games/ap-english-literature/02 - Poetry I Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 550 chars · sample: `Sonnet is a 14-line lyric in iambic pentameter, originated by Giacomo da Lentini`
  * cat[0].clue[1] (value 200) — 561 chars · sample: `Tercet is a three-line stanza, often rhyming aaa, aba, or unrhymed. Dante's Divi`
  * cat[0].clue[2] (value 300) — 568 chars · sample: `Quatrain is a four-line stanza, the most common English stanza form. Ballad mete`
  * cat[0].clue[3] (value 400) — 591 chars · sample: `Couplet is two consecutive rhyming lines forming a complete thought. Heroic coup`
  * cat[0].clue[4] (value 500) — 577 chars · sample: `Free verse is poetry without regular meter or rhyme scheme. Walt Whitman's Leave`
  * cat[1].clue[0] (value 100) — 536 chars · sample: `Meter is the recurring pattern of stressed and unstressed syllables organizing a`
  * cat[1].clue[1] (value 200) — 524 chars · sample: `Iamb is a metrical foot of one unstressed syllable followed by one stressed syll`
  * cat[1].clue[2] (value 300) — 524 chars · sample: `Trochee is a metrical foot of one stressed syllable followed by one unstressed s`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[4].clue[3] (value 400) · sample: `ive evidence — not merely 'fancy words.'`
* **final-explanation-too-verbose** (1)
  * final — 572 chars

### `games/ap-physics-1/04 - Linear Momentum Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 605 chars · sample: `Momentum p = m v (kg * m/s), a vector with the same direction as velocity. Conse`
  * cat[0].clue[1] (value 200) — 542 chars · sample: `Momentum unit: kg * m/s = N * s (the impulse-momentum equivalence). Also equal t`
  * cat[0].clue[2] (value 300) — 618 chars · sample: `Momentum is a vector p = m v, inheriting direction from velocity. This makes 1D `
  * cat[0].clue[3] (value 400) — 577 chars · sample: `Total momentum of a system is conserved when the net external force on the syste`
  * cat[0].clue[4] (value 500) — 517 chars · sample: `F_net = dp/dt — Newton's original statement of his second law (Principia, 1687),`
  * cat[1].clue[0] (value 100) — 590 chars · sample: `Impulse J = F * Delta t (newton-seconds), the integral of force over time interv`
  * cat[1].clue[1] (value 200) — 552 chars · sample: `Impulse-Momentum Theorem: J = Delta p, where J = F_avg * Delta t (N * s) and Del`
  * cat[1].clue[2] (value 300) — 509 chars · sample: `Impulse unit: N * s = kg * m/s (same as momentum, by the impulse-momentum theore`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[4].clue[4] (value 500) · sample: `as heat and sound and deformation work.'`
* **final-explanation-too-verbose** (1)
  * final — 592 chars

### `games/ap-physics-2/99 - Cumulative Yearlong Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 560 chars · sample: `Density rho = m / V (kg/m^3) — mass per unit volume. Water: rho = 1000 kg/m^3; a`
  * cat[0].clue[1] (value 200) — 609 chars · sample: `Buoyancy F_b: upward force on submerged objects from pressure differences betwee`
  * cat[0].clue[2] (value 300) — 569 chars · sample: `Bernoulli's equation: P + (1/2) rho v^2 + rho g h = constant along a streamline `
  * cat[0].clue[3] (value 400) — 587 chars · sample: `First Law of Thermodynamics: Delta U = Q - W (joules), with AP sign convention Q`
  * cat[0].clue[4] (value 500) — 633 chars · sample: `Entropy S (J/K): a measure of disorder or microstate count, with Boltzmann's for`
  * cat[1].clue[0] (value 100) — 613 chars · sample: `Coulomb's law (Charles-Augustin de Coulomb, 1785): F = k q_1 q_2 / r^2 (newtons)`
  * cat[1].clue[1] (value 200) — 577 chars · sample: `Ohm's Law: V = I R (volts), with I current (A), R resistance (Ohm). Georg Ohm (1`
  * cat[1].clue[2] (value 300) — 594 chars · sample: `Capacitor: a charge-storage device with capacitance C = Q/V (farads). Parallel-p`
  * ... and 17 more
* **clue-too-terse** (1)
  * cat[1].clue[4] (value 500) — 10 chars · sample: `Loop rule.`
* **final-explanation-too-verbose** (1)
  * final — 685 chars

### `games/ap-physics-c-em/99 - Cumulative Yearlong Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 709 chars · sample: `Coulomb's law F = k*q_1*q_2/r^2 is the foundational force law for electrostatics`
  * cat[0].clue[1] (value 200) — 636 chars · sample: `Electric field E = F/q is the force per unit charge at a point - a vector field `
  * cat[0].clue[2] (value 300) — 693 chars · sample: `Gauss's law relates electric flux through a closed surface to the enclosed charg`
  * cat[0].clue[3] (value 400) — 637 chars · sample: `Electric potential V = U/q is the potential energy per unit charge, a scalar fie`
  * cat[0].clue[4] (value 500) — 676 chars · sample: `Electric field is the negative gradient of potential: E = -gradient of V (3D vec`
  * cat[1].clue[0] (value 100) — 652 chars · sample: `Ohm's law V = I*R for ohmic conductors, with V the potential difference, I the c`
  * cat[1].clue[1] (value 200) — 670 chars · sample: `Kirchhoff's Current Law (KCL, junction rule): sum of currents entering a node eq`
  * cat[1].clue[2] (value 300) — 651 chars · sample: `Kirchhoff's Voltage Law (KVL, loop rule): sum of voltage drops around a closed l`
  * ... and 17 more
* **clue-too-terse** (1)
  * cat[1].clue[2] (value 300) — 10 chars · sample: `Loop rule.`
* **final-explanation-too-verbose** (1)
  * final — 997 chars

### `games/ap-statistics/07 - Inference for Means Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 632 chars · sample: `The Student's t distribution is used for inference about a population mean when `
  * cat[0].clue[1] (value 200) — 599 chars · sample: `Degrees of freedom for a one-sample t procedure are n - 1. AP Statistics Unit 7 `
  * cat[0].clue[2] (value 300) — 539 chars · sample: `The one-sample t-test statistic is t = (x-bar - mu0)/(s/sqrt(n)), where s is the`
  * cat[0].clue[3] (value 400) — 587 chars · sample: `The one-sample t confidence interval is x-bar plus or minus t*-times-(s/sqrt(n))`
  * cat[0].clue[4] (value 500) — 605 chars · sample: `Conditions for one-sample t inference are Random (random sample), Normal (popula`
  * cat[1].clue[0] (value 100) — 601 chars · sample: `The two-sample t-test compares two population means mu1 and mu2 using independen`
  * cat[1].clue[1] (value 200) — 619 chars · sample: `Welch-Satterthwaite approximation gives the degrees of freedom for an unpooled t`
  * cat[1].clue[2] (value 300) — 601 chars · sample: `The null hypothesis in a two-sample t-test has the form H0: mu1 = mu2, equivalen`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[1].clue[3] (value 400) · sample: `e in means is between [low] and [high].'`
* **final-explanation-too-verbose** (1)
  * final — 821 chars

### `games/grade-12-ela/02 - Reading Literature - Theme Craft Point of View Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 764 chars · sample: `Shakespeare's Hamlet dramatizes the central tension between thought and action -`
  * cat[0].clue[1] (value 200) — 696 chars · sample: `Orwell argues that totalitarianism aims not merely to control behavior but to ex`
  * cat[0].clue[2] (value 300) — 687 chars · sample: `Joseph Conrad argues that European 'civilization' is a thin veneer beneath which`
  * cat[0].clue[3] (value 400) — 660 chars · sample: `Arthur Miller argues the American Dream's promise - that anyone with personality`
  * cat[0].clue[4] (value 500) — 672 chars · sample: `Hosseini argues guilt cannot be evaded; only confronted action allows redemption`
  * cat[1].clue[0] (value 100) — 742 chars · sample: `The Shakespearean (English) sonnet is fourteen lines of iambic pentameter rhymin`
  * cat[1].clue[1] (value 200) — 720 chars · sample: `Iambic pentameter is English's most common meter: five iambs per line (an iamb b`
  * cat[1].clue[2] (value 300) — 677 chars · sample: `The Italian (Petrarchan) sonnet, perfected by Francesco Petrarca (1304-1374) in `
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[0].clue[2] (value 300) · sample: `be's 1975 critique 'An Image of Africa.'`
* **final-explanation-too-verbose** (1)
  * final — 885 chars

### `games/grade-12-ela/06 - Writing - Narrative and Explanatory Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 769 chars · sample: `A statistic hook opens an essay or speech with a startling fact or numerical cla`
  * cat[0].clue[1] (value 200) — 742 chars · sample: `An anecdote hook opens with a brief, vivid story to illustrate a larger point - `
  * cat[0].clue[2] (value 300) — 745 chars · sample: `Strong verb choice demonstrates the writing craft of preferring vivid, specific `
  * cat[0].clue[3] (value 400) — 756 chars · sample: `Foreshadowing is the narrative technique of hinting at future events through sug`
  * cat[0].clue[4] (value 500) — 743 chars · sample: `A rhetorical question hook opens an essay or speech with a provocative question `
  * cat[1].clue[0] (value 100) — 776 chars · sample: `Sensory details engage the five senses - sight, sound, smell, taste, touch - to `
  * cat[1].clue[1] (value 200) — 760 chars · sample: `'Show, don't tell' is the foundational craft principle of preferring dramatized `
  * cat[1].clue[2] (value 300) — 755 chars · sample: `Imagery is description using unexpected comparison - figurative language (metaph`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[0].clue[0] (value 100) · sample: `ptor 'effectively engages the audience.'`
* **final-explanation-too-verbose** (1)
  * final — 1076 chars

### `games/grade-12-ela/99 - Cumulative Yearlong Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 729 chars · sample: `William Shakespeare's Hamlet (c. 1601) is the canonical Renaissance revenge trag`
  * cat[0].clue[1] (value 200) — 704 chars · sample: `George Orwell's Nineteen Eighty-Four, published June 1949, is the canonical 20th`
  * cat[0].clue[2] (value 300) — 725 chars · sample: `Joseph Conrad's Heart of Darkness, serialized in Blackwood's Magazine in 1899 an`
  * cat[0].clue[3] (value 400) — 747 chars · sample: `Dramatic irony occurs when the audience knows something a character does not - p`
  * cat[0].clue[4] (value 500) — 740 chars · sample: `A motif is a recurring image, idea, or symbol that develops thematic meaning acr`
  * cat[1].clue[0] (value 100) — 750 chars · sample: `A metaphor is a direct comparison between two unlike things without 'like' or 'a`
  * cat[1].clue[1] (value 200) — 723 chars · sample: `A kenning is a compressed metaphorical compound characteristic of Anglo-Saxon an`
  * cat[1].clue[2] (value 300) — 730 chars · sample: `Anaphora is the rhetorical device of repeating a word or phrase at the beginning`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[2].clue[0] (value 100) · sample: ` the prompt' and 'no defensible thesis.'`
* **final-explanation-too-verbose** (1)
  * final — 1325 chars

### `games/grade-7-ela/02 - Reading Literature: Theme + Craft Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 604 chars · sample: `Theme is a universal claim about life, human nature, or society, expressed as a `
  * cat[0].clue[1] (value 200) — 577 chars · sample: `Topic is the broad subject of a text—stated in one or two words like 'family,' '`
  * cat[0].clue[2] (value 300) — 570 chars · sample: `A motif is a recurring image, idea, or symbolic element that develops theme acro`
  * cat[0].clue[3] (value 400) — 568 chars · sample: `A moral is an explicit lesson stated or strongly implied at the end of a fable, `
  * cat[0].clue[4] (value 500) — 592 chars · sample: `Theme development is how an author advances a central idea through accumulating `
  * cat[1].clue[0] (value 100) — 613 chars · sample: `A metaphor asserts that one thing is another, creating a direct figurative equat`
  * cat[1].clue[1] (value 200) — 537 chars · sample: `A simile uses 'like' or 'as' to make an explicit comparison between two unlike t`
  * cat[1].clue[2] (value 300) — 567 chars · sample: `Personification attributes human emotions, thoughts, or actions to non-human ent`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[0].clue[0] (value 100) · sample: `ence, not a single word like 'kindness.'`
* **final-explanation-too-verbose** (1)
  * final — 685 chars

### `games/grade-7-ela/03 - Reading Informational: Main Idea, Text Structure Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 577 chars · sample: `The main idea is the most important point an informational text develops—its cen`
  * cat[0].clue[1] (value 200) — 573 chars · sample: `A supporting detail is a specific fact, example, statistic, quotation, or anecdo`
  * cat[0].clue[2] (value 300) — 560 chars · sample: `Topic is the broad subject an informational text examines—stated in one or two w`
  * cat[0].clue[3] (value 400) — 588 chars · sample: `A summary is a brief, objective restatement of an informational text's main idea`
  * cat[0].clue[4] (value 500) — 562 chars · sample: `Central-idea development is how an author builds and supports a main claim acros`
  * cat[1].clue[0] (value 100) — 582 chars · sample: `Chronological order arranges events according to when they occurred, signaled by`
  * cat[1].clue[1] (value 200) — 557 chars · sample: `Cause-and-effect structure explains why something happens (the cause) and what r`
  * cat[1].clue[2] (value 300) — 571 chars · sample: `Compare-and-contrast structure examines similarities and differences between two`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[1] (value 200) · sample: `o the article' or 'the author explains.'`
* **final-explanation-too-verbose** (1)
  * final — 658 chars

### `games/grade-7-ela/05 - Writing: Argument, Informative, Narrative Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 588 chars · sample: `A thesis statement is a clear declarative sentence that states the position the `
  * cat[0].clue[1] (value 200) — 573 chars · sample: `Reasons are the logical points a writer makes to support a thesis. A Grade 7 ess`
  * cat[0].clue[2] (value 300) — 611 chars · sample: `Evidence is the specific facts, statistics, quotations, examples, or research fi`
  * cat[0].clue[3] (value 400) — 597 chars · sample: `A counterclaim is an opposing argument the writer acknowledges and refutes to de`
  * cat[0].clue[4] (value 500) — 578 chars · sample: `A conclusion is the final paragraph that restates the thesis in fresh language, `
  * cat[1].clue[0] (value 100) — 551 chars · sample: `The introduction is the first paragraph that captures reader interest with a hoo`
  * cat[1].clue[1] (value 200) — 583 chars · sample: `A body paragraph develops one reason or main point supporting the thesis through`
  * cat[1].clue[2] (value 300) — 552 chars · sample: `A topic sentence is the first sentence of a body paragraph that states the parag`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[1].clue[3] (value 400) · sample: `ncers like 'firstly, secondly, thirdly.'`
* **final-explanation-too-verbose** (1)
  * final — 718 chars

### `games/grade-7-ela/99 - Cumulative Yearlong Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 594 chars · sample: `S.E. Hinton's The Outsiders (1967), published when Hinton was nineteen, is a lan`
  * cat[0].clue[1] (value 200) — 588 chars · sample: `Sharon Creech's Walk Two Moons (1994) won the Newbery Medal and is a foundationa`
  * cat[0].clue[2] (value 300) — 595 chars · sample: `Kwame Alexander's The Crossover (2014) won the Newbery Medal and is a Grade 7 an`
  * cat[0].clue[3] (value 400) — 566 chars · sample: `R.J. Palacio's Wonder (2012) is a Grade 7 anchor novel told through multiple fir`
  * cat[0].clue[4] (value 500) — 589 chars · sample: `Karen Hesse's Out of the Dust (1997) won the Newbery Medal and is a Grade 7 anch`
  * cat[1].clue[0] (value 100) — 599 chars · sample: `Theme is the universal claim about life or human nature that a work conveys, sta`
  * cat[1].clue[1] (value 200) — 622 chars · sample: `A dynamic character undergoes meaningful internal change in beliefs, values, or `
  * cat[1].clue[2] (value 300) — 593 chars · sample: `Point of view (POV) is the narrative vantage point: first person (I), second per`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[0].clue[1] (value 200) · sample: `u've walked two moons in his moccasins.'`
* **final-explanation-too-verbose** (1)
  * final — 888 chars

### `games/grade-7-math/02 - Rational Number Operations Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 623 chars · sample: `Integers are the set {..., −3, −2, −1, 0, 1, 2, 3, ...}: whole numbers and their`
  * cat[0].clue[1] (value 200) — 590 chars · sample: `Absolute value |x| is the distance from zero on the number line—always non-negat`
  * cat[0].clue[2] (value 300) — 586 chars · sample: `To add two integers with the same sign: add their absolute values, then keep the`
  * cat[0].clue[3] (value 400) — 644 chars · sample: `To subtract integers, change subtraction to addition of the opposite: a − b = a `
  * cat[0].clue[4] (value 500) — 593 chars · sample: `Multiplication of integers follows sign rules: same signs give positive; differe`
  * cat[1].clue[0] (value 100) — 561 chars · sample: `A fraction a/b represents the quotient of two integers where b ≠ 0, and includes`
  * cat[1].clue[1] (value 200) — 549 chars · sample: `To add fractions with different denominators: find a common denominator, convert`
  * cat[1].clue[2] (value 300) — 543 chars · sample: `To multiply fractions: multiply numerators, multiply denominators, simplify. NYS`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[1] (value 200) · sample: `a number line, less-than means left of.'`
* **final-explanation-too-verbose** (1)
  * final — 761 chars

### `games/grade-7-math/04 - Geometry: Scale, Angles, Circles, Volume Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 685 chars · sample: `A scale drawing is a representation where all measurements are proportional to t`
  * cat[0].clue[1] (value 200) — 632 chars · sample: `The scale factor is the ratio between the drawing and the actual size, expressed`
  * cat[0].clue[2] (value 300) — 696 chars · sample: `Similar figures have the same shape but different sizes—corresponding angles are`
  * cat[0].clue[3] (value 400) — 667 chars · sample: `With scale 1:20, every 1 unit on the drawing represents 20 units in actual size.`
  * cat[0].clue[4] (value 500) — 682 chars · sample: `When a figure is scaled by a linear factor k, areas scale by k². NYS Grade 7 Mat`
  * cat[1].clue[0] (value 100) — 654 chars · sample: `Complementary angles have measures summing to 90°—together they form a right ang`
  * cat[1].clue[1] (value 200) — 659 chars · sample: `Supplementary angles have measures summing to 180°—together they form a straight`
  * cat[1].clue[2] (value 300) — 666 chars · sample: `Vertical angles are the angles directly opposite each other when two lines inter`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[2].clue[4] (value 500) · sample: `4' or 'leave your answer in terms of π.'`
* **final-explanation-too-verbose** (1)
  * final — 800 chars

### `games/grade-7-math/06 - Probability Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 687 chars · sample: `Probability is the numerical measure of how likely an event is to occur, express`
  * cat[0].clue[1] (value 200) — 696 chars · sample: `An event with probability 1 (or 100%) is certain to occur. NYS Grade 7 Math stan`
  * cat[0].clue[2] (value 300) — 650 chars · sample: `An event with probability 0 (or 0%) cannot occur—it is impossible. NYS Grade 7 M`
  * cat[0].clue[3] (value 400) — 693 chars · sample: `Theoretical probability is calculated as favorable outcomes ÷ total possible out`
  * cat[0].clue[4] (value 500) — 773 chars · sample: `Experimental probability is calculated as favorable outcomes ÷ total trials from`
  * cat[1].clue[0] (value 100) — 598 chars · sample: `On a fair coin, the two outcomes—heads and tails—are equally likely. P(heads) = `
  * cat[1].clue[1] (value 200) — 629 chars · sample: `On a fair die, six outcomes—1, 2, 3, 4, 5, 6—are equally likely. P(rolling a 3) `
  * cat[1].clue[2] (value 300) — 641 chars · sample: `To find probability: P(red) = number of red / total marbles. NYS Grade 7 Math st`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[0].clue[4] (value 500) · sample: `biased or the trial count is too small.'`
* **final-explanation-too-verbose** (1)
  * final — 834 chars

### `games/grade-8-ela/99 - Cumulative Yearlong Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 546 chars · sample: `Anne Frank's diary, first published in 1947 as Het Achterhuis (The Secret Annex)`
  * cat[0].clue[1] (value 200) — 541 chars · sample: `Linda Sue Park's A Long Walk to Water (2010) is based on the true story of Salva`
  * cat[0].clue[2] (value 300) — 594 chars · sample: `Daniel Keyes's Flowers for Algernon, first published as a short story in 1959 an`
  * cat[0].clue[3] (value 400) — 594 chars · sample: `Edgar Allan Poe's The Tell-Tale Heart (1843) is a first-person confession by an `
  * cat[0].clue[4] (value 500) — 614 chars · sample: `George Orwell's Animal Farm (1945) is a satirical allegory of the 1917 Russian R`
  * cat[1].clue[0] (value 100) — 615 chars · sample: `Langston Hughes's 'Mother to Son' (1922) is a Harlem Renaissance dramatic monolo`
  * cat[1].clue[1] (value 200) — 600 chars · sample: `Langston Hughes's 'I, Too' (1925) is a foundational Harlem Renaissance poem resp`
  * cat[1].clue[2] (value 300) — 577 chars · sample: `The central claim of 'I, Too'—'Tomorrow, / I'll be at the table / When company c`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[3] (value 400) · sample: `his shows that…' or 'This demonstrates…'`
* **final-explanation-too-verbose** (1)
  * final — 783 chars

### `games/grade-8-math/01 - Number System Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 671 chars · sample: `A rational number can be expressed as a fraction p/q where p and q are integers `
  * cat[0].clue[1] (value 200) — 728 chars · sample: `An irrational number cannot be written as a fraction of integers, and its decima`
  * cat[0].clue[2] (value 300) — 686 chars · sample: `The square root of 2 equals 1.41421356... It is the most famous irrational numbe`
  * cat[0].clue[3] (value 400) — 605 chars · sample: `To approximate sqrt(11), find perfect squares on either side: 3^2 = 9 and 4^2 = `
  * cat[0].clue[4] (value 500) — 637 chars · sample: `Every repeating decimal is rational. NYS Common Core Grade 8 standard 8.NS.A.1 e`
  * cat[1].clue[0] (value 100) — 649 chars · sample: `A square root undoes squaring: sqrt(x) is the non-negative number whose square e`
  * cat[1].clue[1] (value 200) — 700 chars · sample: `sqrt(64) = 8 because 8 × 8 = 64. NYS Common Core Grade 8 standard 8.EE.A.2 expli`
  * cat[1].clue[2] (value 300) — 641 chars · sample: `To solve x^2 = 49, take the square root of both sides: x = +/-sqrt(49) = +/-7. T`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[1].clue[3] (value 400) · sample: `' but 'x^2 = 36 has solutions x = +/-6.'`
* **final-explanation-too-verbose** (1)
  * final — 869 chars

### `games/grade-8-math/04 - Systems of Linear Equations Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 717 chars · sample: `A system of equations is two or more equations considered together; a solution i`
  * cat[0].clue[1] (value 200) — 735 chars · sample: `The SOLUTION to a system of two linear equations is the POINT OF INTERSECTION of`
  * cat[0].clue[2] (value 300) — 737 chars · sample: `A system whose two lines are PARALLEL (never intersect) has NO solutions. NYS Co`
  * cat[0].clue[3] (value 400) — 743 chars · sample: `A system whose two lines are THE SAME LINE has INFINITELY many solutions — every`
  * cat[0].clue[4] (value 500) — 782 chars · sample: `A system has EXACTLY ONE solution when the two lines have DIFFERENT slopes (so t`
  * cat[1].clue[0] (value 100) — 778 chars · sample: `To solve a system by graphing: graph BOTH equations on the same coordinate plane`
  * cat[1].clue[1] (value 200) — 598 chars · sample: `The solution to a system is the (x, y) point where the lines cross. If they cros`
  * cat[1].clue[2] (value 300) — 659 chars · sample: `To verify a candidate solution: SUBSTITUTE the (x, y) values into BOTH equations`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[2] (value 300) · sample: `cel opposites, subtract to cancel same.'`
* **final-explanation-too-verbose** (1)
  * final — 862 chars

### `games/grade-8-math/05 - Geometry Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 777 chars · sample: `A TRANSLATION (slide) moves every point the same distance in the same direction.`
  * cat[0].clue[1] (value 200) — 692 chars · sample: `A REFLECTION flips a figure over a LINE (the line of reflection), creating a mir`
  * cat[0].clue[2] (value 300) — 687 chars · sample: `A ROTATION turns a figure around a fixed center point by a specified angle. NYS `
  * cat[0].clue[3] (value 400) — 769 chars · sample: `Rigid transformations (translations, reflections, rotations) PRESERVE side lengt`
  * cat[0].clue[4] (value 500) — 854 chars · sample: `Two figures related by a sequence of rigid transformations (translations, rotati`
  * cat[1].clue[0] (value 100) — 736 chars · sample: `A DILATION enlarges or reduces a figure by a SCALE FACTOR k, centered at a fixed`
  * cat[1].clue[1] (value 200) — 783 chars · sample: `Two figures related by a sequence of dilations and rigid transformations are SIM`
  * cat[1].clue[2] (value 300) — 699 chars · sample: `The SCALE FACTOR k is the ratio of corresponding sides in similar figures. NYS C`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[3].clue[1] (value 200) · sample: `ze: 'cone is one-third of its cylinder.'`
* **final-explanation-too-verbose** (1)
  * final — 913 chars

### `games/living-environment/01 - Similarities and Differences Among Living Things Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 594 chars · sample: `Taxonomy is the science of classifying organisms. Carl Linnaeus founded modern t`
  * cat[0].clue[1] (value 200) — 588 chars · sample: `Binomial nomenclature was standardized by Carl Linnaeus in his 1753 work Species`
  * cat[0].clue[2] (value 300) — 553 chars · sample: `'Dichotomous' means 'cut in two.' At each step the key presents two contrasting `
  * cat[0].clue[3] (value 400) — 619 chars · sample: `A cladogram is built from shared derived characteristics (synapomorphies) — feat`
  * cat[0].clue[4] (value 500) — 713 chars · sample: `Common ancestry is the foundational claim of Darwin's On the Origin of Species (`
  * cat[1].clue[0] (value 100) — 653 chars · sample: `Nutrition is one of the eight life functions tracked by the NY Living Environmen`
  * cat[1].clue[1] (value 200) — 671 chars · sample: `Transport in humans is carried out by the circulatory system — the heart, blood `
  * cat[1].clue[2] (value 300) — 595 chars · sample: `Cellular respiration is the chemical process: glucose + oxygen yields carbon dio`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[4].clue[0] (value 100) · sample: `species evolved from a common ancestor.'`
* **final-explanation-too-verbose** (1)
  * final — 736 chars

### `games/physics-regents/04 - Momentum and Impulse Jeopardy Review.html` — 27 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 854 chars · sample: `Momentum (p) is a vector quantity equal to mass times velocity: p = m·v. SI unit`
  * cat[0].clue[1] (value 200) — 750 chars · sample: `Impulse (J or simply F·Δt) is the vector product of force and the time interval `
  * cat[0].clue[2] (value 300) — 728 chars · sample: `The impulse-momentum theorem states that the net impulse on an object equals its`
  * cat[0].clue[3] (value 400) — 747 chars · sample: `Change in momentum (Δp) is a vector quantity equal to the final momentum minus t`
  * cat[0].clue[4] (value 500) — 907 chars · sample: `System momentum is the vector sum of momenta of all objects in a chosen system: `
  * cat[1].clue[0] (value 100) — 915 chars · sample: `An elastic collision is a collision in which both momentum AND kinetic energy ar`
  * cat[1].clue[1] (value 200) — 865 chars · sample: `An inelastic collision is one in which momentum IS conserved but kinetic energy `
  * cat[1].clue[2] (value 300) — 854 chars · sample: `A perfectly (or completely) inelastic collision is the extreme case of an inelas`
  * ... and 17 more
* **explanation-missing-end-punct** (1)
  * cat[2].clue[0] (value 100) · sample: `omentum in that direction is conserved.'`
* **final-explanation-too-verbose** (1)
  * final — 918 chars

### `games/ap-gov-practice/practice-exam.html` — 27 flag(s), 45 items audited

* **prompt-missing-end-punct** (27)
  * q[1] id=apgov-002 · sample: `itution primarily because it argues that`
  * q[3] id=apgov-004 · sample: `pute at the Constitutional Convention by`
  * q[5] id=apgov-006 · sample: `land (1819), the Supreme Court held that`
  * q[7] id=apgov-008 · sample: `cy differ primarily in their views about`
  * q[8] id=apgov-009 · sample: `ive highway funds, is best classified as`
  * q[9] id=apgov-010 · sample: `understood as a procedural practice that`
  * q[13] id=apgov-014 · sample: `st dangerous branch primarily because it`
  * q[14] id=apgov-015 · sample: `onal primarily because the Supreme Court`
  * ... and 19 more

### `games/algebra-2/02 - Polynomial Functions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 699 chars · sample: `The degree of a polynomial is the highest exponent on the variable (A-APR.1). Fo`
  * cat[0].clue[1] (value 200) — 660 chars · sample: `The leading coefficient is the constant multiplying the highest-power term (A-AP`
  * cat[0].clue[2] (value 300) — 580 chars · sample: `The constant term is a₀ in standard form, the value of the polynomial when x=0, `
  * cat[0].clue[3] (value 400) — 648 chars · sample: `A turning point is where the graph reverses direction—a relative maximum or mini`
  * cat[0].clue[4] (value 500) — 587 chars · sample: `End behavior describes f(x) as x→±∞ (F-IF.7c). The rules: (1) even degree, posit`
  * cat[1].clue[0] (value 100) — 627 chars · sample: `A zero (root, x-intercept) is a value of x for which f(x)=0 (A-APR.3, A-REI.4). `
  * cat[1].clue[1] (value 200) — 590 chars · sample: `Multiplicity is the exponent of a repeated factor (A-APR.3). For f(x)=(x-2)²(x+1`
  * cat[1].clue[2] (value 300) — 585 chars · sample: `The Factor Theorem links zeros and factors: (x-r) is a factor of P(x) if and onl`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 862 chars

### `games/algebra-2/03 - Rational and Radical Functions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 646 chars · sample: `A rational expression is a ratio of two polynomials (A-APR.7). Examples: (x²-4)/`
  * cat[0].clue[1] (value 200) — 645 chars · sample: `An excluded value is an x-value that makes the denominator zero, undefined for t`
  * cat[0].clue[2] (value 300) — 599 chars · sample: `A common denominator is an expression divisible by every denominator in a sum or`
  * cat[0].clue[3] (value 400) — 574 chars · sample: `A complex fraction has fractions in its numerator, denominator, or both (A-APR.7`
  * cat[0].clue[4] (value 500) — 614 chars · sample: `A simplified rational expression has no common factors between numerator and den`
  * cat[1].clue[0] (value 100) — 613 chars · sample: `A vertical asymptote occurs at x=a when (x-a) is a factor of the denominator but`
  * cat[1].clue[1] (value 200) — 594 chars · sample: `A horizontal asymptote describes f(x) as x→±∞ (F-IF.7d). Three cases for f(x)=p(`
  * cat[1].clue[2] (value 300) — 581 chars · sample: `A slant (oblique) asymptote arises when deg(numerator) = deg(denominator) + 1 (F`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 836 chars

### `games/algebra-2/04 - Exponential and Logarithmic Functions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 616 chars · sample: `A logarithm is the inverse of exponentiation: log_b(x)=y means b^y=x (F-BF.5). E`
  * cat[0].clue[1] (value 200) — 626 chars · sample: `Exponential and logarithmic functions are inverses of each other (F-BF.5). y=b^x`
  * cat[0].clue[2] (value 300) — 619 chars · sample: `The base of a logarithm is the b in log_b(x) (F-BF.5). Restriction: b>0 and b≠1 `
  * cat[0].clue[3] (value 400) — 610 chars · sample: `The common logarithm is log base 10, abbreviated log(x) (F-BF.5). log(100)=2, lo`
  * cat[0].clue[4] (value 500) — 634 chars · sample: `The natural logarithm is log base e≈2.71828, written ln(x) (F-BF.5). Like all lo`
  * cat[1].clue[0] (value 100) — 575 chars · sample: `The product property of logs: log_b(MN)=log_b(M)+log_b(N) (A-SSE.2, F-BF.5). Exa`
  * cat[1].clue[1] (value 200) — 559 chars · sample: `The quotient property of logs: log_b(M/N)=log_b(M)-log_b(N) (A-SSE.2, F-BF.5). E`
  * cat[1].clue[2] (value 300) — 622 chars · sample: `A logarithmic graph has shape determined by base b (F-IF.7e). For b>1: domain x>`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 779 chars

### `games/algebra-2/05 - Trigonometric Functions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 580 chars · sample: `Radian measure expresses angles as arc length on a unit circle (F-TF.1). One rad`
  * cat[0].clue[1] (value 200) — 567 chars · sample: `The unit circle is the circle x²+y²=1 (F-TF.2). For an angle θ measured from the`
  * cat[0].clue[2] (value 300) — 615 chars · sample: `The terminal side of an angle θ in standard position (vertex at origin, initial `
  * cat[0].clue[3] (value 400) — 550 chars · sample: `A reference angle θ' is the acute (positive) angle between the terminal side of `
  * cat[0].clue[4] (value 500) — 587 chars · sample: `Coterminal angles share a terminal side and differ by an integer multiple of 2π `
  * cat[1].clue[0] (value 100) — 539 chars · sample: `The sine function maps an angle θ to the y-coordinate of its point on the unit c`
  * cat[1].clue[1] (value 200) — 543 chars · sample: `The cosine function maps angle θ to the x-coordinate of its unit circle point (F`
  * cat[1].clue[2] (value 300) — 605 chars · sample: `The tangent function is tan(θ)=sin(θ)/cos(θ) (F-TF.2). Range all reals, period π`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 871 chars

### `games/algebra-2/06 - Sequences and Series Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 618 chars · sample: `A sequence is an ordered list of numbers, often called terms, indexed by positiv`
  * cat[0].clue[1] (value 200) — 528 chars · sample: `A partial sum Sₙ is the sum of the first n terms of a sequence (A-SSE.4). For ar`
  * cat[0].clue[2] (value 300) — 589 chars · sample: `The term number (index) n identifies the position in the sequence (F-IF.3). a₁ i`
  * cat[0].clue[3] (value 400) — 615 chars · sample: `A recursive formula defines each term using one or more previous terms (F-BF.2).`
  * cat[0].clue[4] (value 500) — 636 chars · sample: `An explicit formula gives aₙ as a function of n directly, without needing prior `
  * cat[1].clue[0] (value 100) — 678 chars · sample: `An arithmetic sequence has a constant common difference d between consecutive te`
  * cat[1].clue[1] (value 200) — 637 chars · sample: `A linear pattern is a sequence whose terms lie on a straight line when graphed a`
  * cat[1].clue[2] (value 300) — 640 chars · sample: `The arithmetic mean of two numbers a and b is (a+b)/2 (S-ID.4 connection). In an`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 782 chars

### `games/algebra-2/07 - Probability and Statistics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 651 chars · sample: `The sample space S is the set of all possible outcomes of a random experiment (S`
  * cat[0].clue[1] (value 200) — 525 chars · sample: `The complement A' (or A^c) of event A consists of all outcomes in the sample spa`
  * cat[0].clue[2] (value 300) — 567 chars · sample: `The addition rule: P(A∪B)=P(A)+P(B)-P(A∩B) (S-CP.7). Subtracting the intersectio`
  * cat[0].clue[3] (value 400) — 582 chars · sample: `The multiplication rule: P(A∩B)=P(A)·P(B|A), where P(B|A) is the conditional pro`
  * cat[0].clue[4] (value 500) — 650 chars · sample: `Conditional probability P(B|A) restricts the sample space to A and asks the prop`
  * cat[1].clue[0] (value 100) — 659 chars · sample: `A permutation is an ordered arrangement: ⁿPᵣ=n!/(n-r)! (S-CP.9). Example: number`
  * cat[1].clue[1] (value 200) — 572 chars · sample: `A combination is an unordered selection: ⁿCᵣ=n!/(r!(n-r)!), often written C(n,r)`
  * cat[1].clue[2] (value 300) — 623 chars · sample: `Factorial n!=n(n-1)(n-2)···1 counts the number of orderings of n distinct object`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 819 chars

### `games/algebra-2/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 723 chars · sample: `A function transformation combines vertical/horizontal shifts, reflections, and `
  * cat[0].clue[1] (value 200) — 626 chars · sample: `An inverse relation swaps the x- and y-coordinates of every ordered pair in a fu`
  * cat[0].clue[2] (value 300) — 578 chars · sample: `A composition result (f∘g)(x)=f(g(x)) chains two functions (F-BF.1). Example: f(`
  * cat[0].clue[3] (value 400) — 629 chars · sample: `A piecewise domain partitions the x-axis into intervals, each with its own funct`
  * cat[0].clue[4] (value 500) — 658 chars · sample: `An average rate of change comparison contrasts how fast two functions grow on a `
  * cat[1].clue[0] (value 100) — 670 chars · sample: `A polynomial zero is a value x=r where P(r)=0 (A-APR.3). Tools to find zeros: (1`
  * cat[1].clue[1] (value 200) — 651 chars · sample: `A rational restriction is an excluded value where the denominator of a rational `
  * cat[1].clue[2] (value 300) — 617 chars · sample: `A radical solution check verifies candidate solutions in the original equation (`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1003 chars

### `games/ap-biology/02 - Cell Structure and Function Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 583 chars · sample: `Mitochondria (Altmann 1890 'bioblasts'; Benda 1898 named them) are 0.5-1 μm doub`
  * cat[0].clue[1] (value 200) — 566 chars · sample: `Prokaryotes (Greek: pro = before, karyon = nucleus) lack membrane-bound organell`
  * cat[0].clue[2] (value 300) — 632 chars · sample: `Chloroplasts (3-10 μm) house photosynthesis (Unit 3). Their double membrane plus`
  * cat[0].clue[3] (value 400) — 638 chars · sample: `Eukaryotes (true nucleus) emerged ~2 Bya, likely via archaeal-host + bacterial-e`
  * cat[0].clue[4] (value 500) — 645 chars · sample: `Lysosomes (de Duve 1955, Nobel 1974) are single-membrane organelles maintaining `
  * cat[1].clue[0] (value 100) — 557 chars · sample: `Phospholipids have a glycerol backbone, two fatty acid tails, and a phosphate-li`
  * cat[1].clue[1] (value 200) — 637 chars · sample: `The nucleus (5-10 μm) is bounded by a double membrane (nuclear envelope) continu`
  * cat[1].clue[2] (value 300) — 626 chars · sample: `Rough ER is studded with ribosomes synthesizing proteins destined for secretion,`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 536 chars

### `games/ap-biology/03 - Cellular Energetics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 584 chars · sample: `ATP (adenosine triphosphate) has a high-energy γ-phosphate bond (ΔG° ≈ -30.5 kJ/`
  * cat[0].clue[1] (value 200) — 558 chars · sample: `Entropy (S) measures the number of microstates a system can occupy: ΔS_universe `
  * cat[0].clue[2] (value 300) — 651 chars · sample: `Peter Mitchell (1961 hypothesis, 1978 Nobel) proposed chemiosmotic coupling: the`
  * cat[0].clue[3] (value 400) — 667 chars · sample: `The ETC consists of four complexes embedded in the inner mitochondrial membrane:`
  * cat[0].clue[4] (value 500) — 689 chars · sample: `Paul Boyer (1997 Nobel with John Walker) proposed the binding-change mechanism f`
  * cat[1].clue[0] (value 100) — 627 chars · sample: `Chlorophyll a (peaks at 430 and 662 nm — blue and red) is the primary photosynth`
  * cat[1].clue[1] (value 200) — 618 chars · sample: `Photosystem II (PSII, with reaction center pigment P680) absorbs light at 680 nm`
  * cat[1].clue[2] (value 300) — 592 chars · sample: `Exergonic reactions release free energy (ΔG < 0) and are spontaneous (kinetic, n`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 573 chars

### `games/ap-biology/04 - Cell Communication and Cell Cycle Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 622 chars · sample: `A ligand is any molecule (hormone, neurotransmitter, growth factor, gas, peptide`
  * cat[0].clue[1] (value 200) — 657 chars · sample: `GPCRs are the largest receptor family (~800 human genes, ~30% of FDA-approved dr`
  * cat[0].clue[2] (value 300) — 616 chars · sample: `RTKs (~58 human members, including insulin receptor, EGFR, FGFR, VEGFR, PDGFR) t`
  * cat[0].clue[3] (value 400) — 654 chars · sample: `Direct contact signaling moves ions and small molecules (<1000 Da) through gap j`
  * cat[0].clue[4] (value 500) — 643 chars · sample: `Ligand-gated ion channels (ionotropic receptors) combine receptor + channel: lig`
  * cat[1].clue[0] (value 100) — 614 chars · sample: `Signal transduction is the conversion of extracellular signals (ligand-receptor `
  * cat[1].clue[1] (value 200) — 620 chars · sample: `Second messengers are small intracellular signaling molecules generated rapidly `
  * cat[1].clue[2] (value 300) — 635 chars · sample: `Phosphorylation by kinases (using ATP) on serine, threonine, or tyrosine residue`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 682 chars

### `games/ap-biology/05 - Heredity Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 706 chars · sample: `Meiosis reduces chromosome number from diploid (2n) to haploid (n) in two rounds`
  * cat[0].clue[1] (value 200) — 641 chars · sample: `Mendel's second law (1866): alleles of different genes segregate independently i`
  * cat[0].clue[2] (value 300) — 688 chars · sample: `Meiosis II resembles mitosis in mechanics but begins with haploid (n) cells (eac`
  * cat[0].clue[3] (value 400) — 626 chars · sample: `Trinucleotide repeat expansion disorders include Huntington's disease (HTT gene,`
  * cat[0].clue[4] (value 500) — 703 chars · sample: `Nondisjunction is failure of homologs (meiosis I) or sister chromatids (meiosis `
  * cat[1].clue[0] (value 100) — 657 chars · sample: `A dominant allele (uppercase, e.g., A) is expressed in heterozygous (Aa) and hom`
  * cat[1].clue[1] (value 200) — 549 chars · sample: `The sum rule: P(A or B) = P(A) + P(B) - P(A and B); for mutually exclusive event`
  * cat[1].clue[2] (value 300) — 604 chars · sample: `Reginald Punnett (1905, Cambridge) devised the Punnett square as a probabilistic`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 654 chars

### `games/ap-biology/06 - Gene Expression and Regulation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 627 chars · sample: `DNA polymerases synthesize new DNA in 5'→3' direction by adding dNTPs to the 3'-`
  * cat[0].clue[1] (value 200) — 692 chars · sample: `Helicases (ATP-dependent motor proteins) unwind double-stranded DNA at replicati`
  * cat[0].clue[2] (value 300) — 647 chars · sample: `Primase synthesizes short (~10 nt) RNA primers providing the 3'-OH needed for DN`
  * cat[0].clue[3] (value 400) — 643 chars · sample: `DNA ligase seals the phosphodiester backbone between Okazaki fragments (~100-200`
  * cat[0].clue[4] (value 500) — 705 chars · sample: `Telomerase is a ribonucleoprotein reverse transcriptase (TERT protein + TERC RNA`
  * cat[1].clue[0] (value 100) — 572 chars · sample: `RNA polymerase synthesizes RNA from a DNA template in 5'→3' direction, NO primer`
  * cat[1].clue[1] (value 200) — 633 chars · sample: `The 5' cap is added co-transcriptionally to nascent mRNA: a 7-methylguanosine co`
  * cat[1].clue[2] (value 300) — 708 chars · sample: `Repressors are DNA-binding proteins that block RNA polymerase access to a promot`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 719 chars

### `games/ap-biology/07 - Natural Selection Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 685 chars · sample: `Directional selection favors one phenotypic extreme, shifting the population mea`
  * cat[0].clue[1] (value 200) — 768 chars · sample: `Homologous structures share evolutionary origin but may have different functions`
  * cat[0].clue[2] (value 300) — 730 chars · sample: `All known living organisms share a common ancestor — LUCA (Last Universal Common`
  * cat[0].clue[3] (value 400) — 799 chars · sample: `Convergent evolution: independent evolution of similar features in unrelated lin`
  * cat[0].clue[4] (value 500) — 740 chars · sample: `Punctuated equilibrium (Eldredge and Gould 1972) proposes that most species spen`
  * cat[1].clue[0] (value 100) — 670 chars · sample: `Hardy (1908) and Weinberg (independently 1908) derived: for a two-allele locus (`
  * cat[1].clue[1] (value 200) — 576 chars · sample: `If q² = 1/10,000 = 0.0001, then q = √0.0001 = 0.01. p = 1 - 0.01 = 0.99. Heteroz`
  * cat[1].clue[2] (value 300) — 704 chars · sample: `Cyanobacteria (formerly 'blue-green algae') evolved oxygenic photosynthesis ~2.7`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 727 chars

### `games/ap-biology/08 - Ecology Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 713 chars · sample: `Exponential growth: dN/dt = rN, where N = population size, r = intrinsic per cap`
  * cat[0].clue[1] (value 200) — 659 chars · sample: `Logistic growth: dN/dt = rN × (K-N)/K. Verhulst (1838) introduced; rediscovered `
  * cat[0].clue[2] (value 300) — 723 chars · sample: `R-selected (r-strategist) species: high r (intrinsic growth rate), many small of`
  * cat[0].clue[3] (value 400) — 761 chars · sample: `Climate change causes species range shifts (poleward and upslope) and phenologic`
  * cat[0].clue[4] (value 500) — 794 chars · sample: `Island biogeography (MacArthur and Wilson 1967 book) predicts species richness f`
  * cat[1].clue[0] (value 100) — 737 chars · sample: `Competition (-/-) for limiting resources (food, water, light, space, mates). Int`
  * cat[1].clue[1] (value 200) — 715 chars · sample: `Imprinting: rapid, durable learning during a sensitive (critical) period in earl`
  * cat[1].clue[2] (value 300) — 750 chars · sample: `Keystone species (Paine 1966 — coined the term studying Pisaster ochraceus sea s`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 675 chars

### `games/ap-biology/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 593 chars · sample: `ATP unifies Units 1 (structure: adenine + ribose + 3 phosphates), 3 (synthesis: `
  * cat[0].clue[1] (value 200) — 640 chars · sample: `Apoptosis links Units 4 (cell-cycle control + caspase cascades), 6 (transcriptio`
  * cat[0].clue[2] (value 300) — 646 chars · sample: `Miller-Urey (1953) — abiotic synthesis of amino acids — links Units 1 (macromole`
  * cat[0].clue[3] (value 400) — 537 chars · sample: `DNA unifies Units 1 (nucleotide chemistry, antiparallel double helix — Watson-Cr`
  * cat[0].clue[4] (value 500) — 625 chars · sample: `Crick's central dogma (1958) links Units 1 (macromolecules), 4 (regulated gene e`
  * cat[1].clue[0] (value 100) — 647 chars · sample: `Chemiosmosis (Mitchell 1961, Nobel 1978) unifies Units 2 (membrane structure — H`
  * cat[1].clue[1] (value 200) — 574 chars · sample: `Ribosome unifies Units 1 (rRNA + protein structure), 2 (free vs. ER-bound), 6 (t`
  * cat[1].clue[2] (value 300) — 555 chars · sample: `Ion channels span Units 2 (membrane transport: K+, Na+, Ca2+ channels — MacKinno`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 882 chars

### `games/ap-calculus-ab/01 - Limits and Continuity Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 568 chars · sample: `A limit lim(x->c) f(x) = L formalizes the value f targets as x approaches c. New`
  * cat[0].clue[1] (value 200) — 574 chars · sample: `lim(x->c-) f(x) considers only x < c, approaching c from the left. The two-sided`
  * cat[0].clue[2] (value 300) — 550 chars · sample: `If g(x) <= f(x) <= h(x) near c and lim(x->c) g = lim(x->c) h = L, then lim(x->c)`
  * cat[0].clue[3] (value 400) — 561 chars · sample: `Indeterminate forms include 0/0, infinity/infinity, 0*infinity, infinity-infinit`
  * cat[0].clue[4] (value 500) — 595 chars · sample: `IVT: if f is continuous on [a,b] and N lies between f(a) and f(b), there exists `
  * cat[1].clue[0] (value 100) — 614 chars · sample: `Continuity at c requires three conditions: (1) f(c) is defined, (2) lim(x->c) f(`
  * cat[1].clue[1] (value 200) — 554 chars · sample: `A 'hole' in the graph: lim(x->c-) and lim(x->c+) both exist and agree, but f(c) `
  * cat[1].clue[2] (value 300) — 559 chars · sample: `At c, at least one one-sided limit of f is plus or minus infinity, producing a v`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 634 chars

### `games/ap-calculus-ab/03 - Composite, Implicit, Inverse Differentiation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 576 chars · sample: `d/dx[f(g(x))] = f'(g(x)) * g'(x) — the Chain Rule. Leibniz (1676 manuscript) use`
  * cat[0].clue[1] (value 200) — 501 chars · sample: `d/dx[(3x + 1)^5]: by the Chain Rule (Leibniz 1676, Cauchy 1823), differentiate t`
  * cat[0].clue[2] (value 300) — 574 chars · sample: `d/dx[sin(x^2)]: outer function sin -> cos, evaluated at x^2; inner derivative d/`
  * cat[0].clue[3] (value 400) — 570 chars · sample: `d/dx[e^(3x)]: outer derivative d/du[e^u] = e^u evaluated at u = 3x gives e^(3x);`
  * cat[0].clue[4] (value 500) — 519 chars · sample: `d/dx[ln(f(x))] = f'(x)/f(x), by Chain Rule with outer ln (derivative 1/u) and in`
  * cat[1].clue[0] (value 100) — 558 chars · sample: `Implicit differentiation: differentiate both sides of F(x, y) = 0 with respect t`
  * cat[1].clue[1] (value 200) — 530 chars · sample: `x^2 + y^2 = 25 (circle of radius 5). Differentiate implicitly: 2x + 2y dy/dx = 0`
  * cat[1].clue[2] (value 300) — 580 chars · sample: `d/dx[y^2] = 2y * dy/dx by the Chain Rule because y is assumed implicitly a funct`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 656 chars

### `games/ap-calculus-ab/04 - Contextual Applications of Differentiation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 588 chars · sample: `Related rates problems connect two quantities both varying in time t via an alge`
  * cat[0].clue[1] (value 200) — 601 chars · sample: `In related rates problems, differentiation is with respect to time t — every geo`
  * cat[0].clue[2] (value 300) — 543 chars · sample: `Sphere surface area A = 4 pi r^2. Differentiate with respect to t: dA/dt = 8 pi `
  * cat[0].clue[3] (value 400) — 534 chars · sample: `Implicit differentiation with respect to time t is the standard technique. Setup`
  * cat[0].clue[4] (value 500) — 570 chars · sample: `Cone V = (1/3) pi r^2 h has two variables r and h, but for an inverted cone fill`
  * cat[1].clue[0] (value 100) — 578 chars · sample: `The tangent line at (a, f(a)) is the best linear approximation to f near x = a, `
  * cat[1].clue[1] (value 200) — 530 chars · sample: `f(x) = sqrt x, a = 4. Compute f(4) = 2 and f'(x) = 1/(2 sqrt x), so f'(4) = 1/4.`
  * cat[1].clue[2] (value 300) — 574 chars · sample: `For a concave-up function (f'' > 0), the tangent line lies BELOW the curve, so t`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 673 chars

### `games/ap-calculus-ab/05 - Analytical Applications of Differentiation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 575 chars · sample: `The absolute (global) maximum of f on [a, b] is the largest output value f(x) at`
  * cat[0].clue[1] (value 200) — 592 chars · sample: `A local (relative) extremum at c means f(c) is the largest (max) or smallest (mi`
  * cat[0].clue[2] (value 300) — 612 chars · sample: `Extreme Value Theorem (EVT): if f is continuous on a closed bounded interval [a,`
  * cat[0].clue[3] (value 400) — 545 chars · sample: `A critical point of f is an interior point c where f'(c) = 0 or f'(c) is undefin`
  * cat[0].clue[4] (value 500) — 623 chars · sample: `The Extreme Value Theorem (Weierstrass, 1860s Berlin lectures): a continuous fun`
  * cat[1].clue[0] (value 100) — 603 chars · sample: `The First Derivative Test (FDT) classifies a critical point c using sign changes`
  * cat[1].clue[1] (value 200) — 554 chars · sample: `If f'(x) > 0 on an interval I, then f is strictly increasing on I — for any x1 <`
  * cat[1].clue[2] (value 300) — 538 chars · sample: `If f'(x) < 0 on an interval I, then f is strictly decreasing on I — for any x1 <`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 667 chars

### `games/ap-calculus-ab/06 - Integration and Accumulation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 618 chars · sample: `An antiderivative F of f satisfies F'(x) = f(x). By a corollary of the Mean Valu`
  * cat[0].clue[1] (value 200) — 522 chars · sample: `For n != -1: integral of x^n dx = x^(n+1)/(n+1) + C. The reverse Power Rule, der`
  * cat[0].clue[2] (value 300) — 596 chars · sample: `integral of 1/x dx = ln|x| + C (for x != 0). The absolute value is essential — w`
  * cat[0].clue[3] (value 400) — 581 chars · sample: `integral of e^x dx = e^x + C. Trivial because d/dx[e^x] = e^x — exponential is i`
  * cat[0].clue[4] (value 500) — 608 chars · sample: `integral of sec^2(x) dx = tan x + C. Direct from d/dx[tan x] = sec^2(x). The com`
  * cat[1].clue[0] (value 100) — 605 chars · sample: `The definite integral integral_a^b f(x) dx represents the signed area under f fr`
  * cat[1].clue[1] (value 200) — 594 chars · sample: `When f(x) >= 0 on [a, b], integral_a^b f(x) dx equals the area of the region bou`
  * cat[1].clue[2] (value 300) — 627 chars · sample: `A Riemann sum approximates integral_a^b f(x) dx using a sum of rectangle areas: `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 671 chars

### `games/ap-calculus-ab/08 - Applications of Integration Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 623 chars · sample: `Area between curves on [a, b] (with f >= g): A = integral_a^b (f(x) - g(x)) dx —`
  * cat[0].clue[1] (value 200) — 623 chars · sample: `When two curves f and g cross within [a, b], one function is on top in some sub-`
  * cat[0].clue[2] (value 300) — 565 chars · sample: `For regions where x = f(y) and x = g(y) are easier to express than y as function`
  * cat[0].clue[3] (value 400) — 522 chars · sample: `For 0 <= x <= 1, y = x is above y = x^2 (check: x = x^2 at x = 0 and x = 1; at x`
  * cat[0].clue[4] (value 500) — 528 chars · sample: `For the region enclosed by y^2 = x (parabola opening right) and y = x - 2 (line)`
  * cat[1].clue[0] (value 100) — 583 chars · sample: `Volume of a solid of revolution by disks (rotation about x-axis): V = integral_a`
  * cat[1].clue[1] (value 200) — 564 chars · sample: `For a solid of revolution with a hole (washer cross-section), V = integral_a^b p`
  * cat[1].clue[2] (value 300) — 588 chars · sample: `Disk method: V = integral_0^4 pi [sqrt(x)]^2 dx = integral_0^4 pi x dx = pi [x^2`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 654 chars

### `games/ap-calculus-ab/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 670 chars · sample: `Indeterminate forms include 0/0, infinity/infinity, 0*infinity, infinity-infinit`
  * cat[0].clue[1] (value 200) — 607 chars · sample: `The Intermediate Value Theorem (IVT): if f is continuous on [a, b] and N is betw`
  * cat[0].clue[2] (value 300) — 558 chars · sample: `lim(x->0) sin(x)/x = 1 — the foundational trig limit, proved via the Squeeze The`
  * cat[0].clue[3] (value 400) — 647 chars · sample: `At c, at least one one-sided limit of f is plus or minus infinity, producing a v`
  * cat[0].clue[4] (value 500) — 607 chars · sample: `At c, lim(x->c-) f and lim(x->c+) f are both finite but unequal — the two-sided `
  * cat[1].clue[0] (value 100) — 659 chars · sample: `d/dx[x^n] = n x^(n-1) — the Power Rule. Newton (1665) derived it for positive in`
  * cat[1].clue[1] (value 200) — 668 chars · sample: `The Chain Rule: d/dx[f(g(x))] = f'(g(x)) * g'(x). Leibniz (1676 manuscript) used`
  * cat[1].clue[2] (value 300) — 581 chars · sample: `d/dx[e^x] = e^x — the unique non-zero function equal to its own derivative. Eule`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 697 chars

### `games/ap-calculus-bc/02 - Differentiation Basics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 579 chars · sample: `f'(c) = lim h to 0 of [f(c + h) - f(c)] / h, the instantaneous rate of change de`
  * cat[0].clue[1] (value 200) — 528 chars · sample: `f'(a) is the slope of the line tangent to y = f(x) at the point (a, f(a)). Equat`
  * cat[0].clue[2] (value 300) — 586 chars · sample: `If x(t) is position, then v(t) = x'(t) is velocity, and a(t) = v'(t) = x''(t) is`
  * cat[0].clue[3] (value 400) — 636 chars · sample: `f is differentiable at c if lim h to 0 of [f(c + h) - f(c)] / h exists as a fini`
  * cat[0].clue[4] (value 500) — 606 chars · sample: `If f is differentiable at c, then f is continuous at c. Proof: lim h to 0 of [f(`
  * cat[1].clue[0] (value 100) — 579 chars · sample: `Power rule: d/dx of x^n = n x^(n-1), valid for every real n. Proven for positive`
  * cat[1].clue[1] (value 200) — 502 chars · sample: `Product rule: d/dx [f(x) g(x)] = f'(x) g(x) + f(x) g'(x), discovered by Gottfrie`
  * cat[1].clue[2] (value 300) — 549 chars · sample: `d/dx [f/g] = (f'(x) g(x) - f(x) g'(x)) / g(x)^2, valid wherever g is nonzero. De`
  * ... and 16 more
* **clue-too-terse** (1)
  * cat[1].clue[1] (value 200) — 11 chars · sample: `d/dx of fg.`
* **final-explanation-too-verbose** (1)
  * final — 610 chars

### `games/ap-calculus-bc/04 - Contextual Applications of Differentiation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 591 chars · sample: `Related-rates problems: an equation F(x, y, ...) = constant links quantities all`
  * cat[0].clue[1] (value 200) — 595 chars · sample: `All related-rates equations are differentiated with respect to time t, not the g`
  * cat[0].clue[2] (value 300) — 550 chars · sample: `Sphere volume V = (4/3) pi r^3 differentiates with respect to time as dV/dt = 4 `
  * cat[0].clue[3] (value 400) — 529 chars · sample: `Ladder of length L leaning against a wall: x^2 + y^2 = L^2 with x(t) = horizonta`
  * cat[0].clue[4] (value 500) — 528 chars · sample: `Inverted-cone water tank: at any depth h, the water surface has radius r satisfy`
  * cat[1].clue[0] (value 100) — 581 chars · sample: `The tangent line to f at x = a is the best first-order (linear) approximation to`
  * cat[1].clue[1] (value 200) — 531 chars · sample: `f(x) = sqrt x at a = 4: f(4) = 2, f'(x) = 1/(2 sqrt x), f'(4) = 1/4. So lineariz`
  * cat[1].clue[2] (value 300) — 583 chars · sample: `If f''(x) > 0 (concave up) on an interval around a, the tangent line at a lies b`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 632 chars

### `games/ap-calculus-bc/06 - Integration and Accumulation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 554 chars · sample: `An antiderivative of f on an interval I is a function F whose derivative is f: F`
  * cat[0].clue[1] (value 200) — 528 chars · sample: `Power rule for antiderivatives: integral x^n dx = x^(n+1)/(n+1) + C for n not eq`
  * cat[0].clue[2] (value 300) — 546 chars · sample: `integral 1/x dx = ln |x| + C, the special-case antiderivative excluded from the `
  * cat[0].clue[3] (value 400) — 564 chars · sample: `integral e^x dx = e^x + C: the antiderivative of e^x is e^x itself, since d/dx o`
  * cat[0].clue[4] (value 500) — 547 chars · sample: `integral sec^2(x) dx = tan x + C, the inverse of the trig derivative d/dx of tan`
  * cat[1].clue[0] (value 100) — 599 chars · sample: `Riemann sum: an approximation to integral from a to b of f(x) dx using rectangle`
  * cat[1].clue[1] (value 200) — 536 chars · sample: `LRAM (Left Riemann Approximation Method) uses the left endpoint of each subinter`
  * cat[1].clue[2] (value 300) — 540 chars · sample: `RRAM (Right Riemann Approximation Method) uses the right endpoint of each subint`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 609 chars

### `games/ap-calculus-bc/07 - Differential Equations Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 600 chars · sample: `A differential equation is an equation relating a function and its derivatives: `
  * cat[0].clue[1] (value 200) — 570 chars · sample: `A separable ODE has the form dy/dx = g(x) h(y), where the right side factors int`
  * cat[0].clue[2] (value 300) — 578 chars · sample: `To find a PARTICULAR solution of a first-order ODE (not just the general solutio`
  * cat[0].clue[3] (value 400) — 537 chars · sample: `For the exponential-growth/decay ODE dy/dt = k y with initial condition y(0) = y`
  * cat[0].clue[4] (value 500) — 543 chars · sample: `For a linear first-order ODE that is NOT separable, like dy/dx + P(x) y = Q(x), `
  * cat[1].clue[0] (value 100) — 570 chars · sample: `A slope field (direction field) is a visualization of a first-order ODE dy/dx = `
  * cat[1].clue[1] (value 200) — 529 chars · sample: `For dy/dx = x y at the point (1, 2), evaluate f(x, y) = xy at (1, 2): slope = 1 `
  * cat[1].clue[2] (value 300) — 609 chars · sample: `Beyond visualization, slope fields allow students to ESTIMATE solution behavior `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 671 chars

### `games/ap-calculus-bc/09 - Parametric, Polar, Vector Functions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 531 chars · sample: `A parametric curve is defined by two equations x = x(t), y = y(t) for a paramete`
  * cat[0].clue[1] (value 200) — 575 chars · sample: `For a parametric curve x = x(t), y = y(t), the slope of the tangent line in (x, `
  * cat[0].clue[2] (value 300) — 503 chars · sample: `Second derivative for a parametric curve: d^2y/dx^2 = d/dx[dy/dx] = (d/dt[dy/dx]`
  * cat[0].clue[3] (value 400) — 518 chars · sample: `Arc length of a parametric curve x(t), y(t) on [t_1, t_2]: L = integral from t_1`
  * cat[0].clue[4] (value 500) — 528 chars · sample: `Speed of a particle moving along the parametric curve x(t), y(t) is |v(t)| = sqr`
  * cat[1].clue[0] (value 100) — 526 chars · sample: `Polar coordinates (r, theta): each point in the plane is specified by its distan`
  * cat[1].clue[1] (value 200) — 515 chars · sample: `Cartesian x-coordinate from polar: x = r cos theta, where r is the polar radius `
  * cat[1].clue[2] (value 300) — 549 chars · sample: `Cartesian y-coordinate from polar: y = r sin theta, where r is the polar radius `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 627 chars

### `games/ap-calculus-bc/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 555 chars · sample: `An expression like 0/0, infty/infty, 0 * infty, infty - infty, 1^infty, 0^0, or `
  * cat[0].clue[1] (value 200) — 553 chars · sample: `Power rule: d/dx of x^n = n x^(n-1) for every real n. Proven for positive intege`
  * cat[0].clue[2] (value 300) — 547 chars · sample: `Chain rule: d/dx of f(g(x)) = f'(g(x)) g'(x). Discovered by Leibniz (1676) and f`
  * cat[0].clue[3] (value 400) — 530 chars · sample: `Mean Value Theorem (Joseph-Louis Lagrange, Theorie des fonctions analytiques, 17`
  * cat[0].clue[4] (value 500) — 513 chars · sample: `d/dx of arctan x = 1/(1 + x^2) for all real x. Derive from y = arctan x: tan y =`
  * cat[1].clue[0] (value 100) — 556 chars · sample: `Power rule for antiderivatives: integral x^n dx = x^(n+1)/(n+1) + C for n not eq`
  * cat[1].clue[1] (value 200) — 520 chars · sample: `Fundamental Theorem of Calculus (Newton 1666 fluxions, Leibniz 1675 dy/dx; rigor`
  * cat[1].clue[2] (value 300) — 564 chars · sample: `MRAM (Midpoint Riemann Approximation Method) uses the midpoint of each subinterv`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 621 chars

### `games/ap-chemistry/01 - Atomic Structure and Properties Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 597 chars · sample: `The mass spectrometer was developed by J.J. Thomson (1912) and refined by F.W. A`
  * cat[0].clue[1] (value 200) — 520 chars · sample: `Average atomic mass = Σ(isotope mass × fractional abundance), expressed in atomi`
  * cat[0].clue[2] (value 300) — 573 chars · sample: `Isotopes share atomic number Z (same proton count, same element identity, same c`
  * cat[0].clue[3] (value 400) — 535 chars · sample: `Relative abundance is the percentage of a given isotope in a natural sample of a`
  * cat[0].clue[4] (value 500) — 509 chars · sample: `For any isotope, neutron count = mass number (A) − atomic number (Z). For Cl-35,`
  * cat[1].clue[0] (value 100) — 602 chars · sample: `Electron configuration lists each occupied orbital with the number of electrons `
  * cat[1].clue[1] (value 200) — 567 chars · sample: `Friedrich Hund's 1927 rule of maximum multiplicity says that for degenerate orbi`
  * cat[1].clue[2] (value 300) — 580 chars · sample: `Fluorine has electron configuration 1s² 2s² 2p⁵, so its PES spectrum shows three`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 605 chars

### `games/ap-chemistry/02 - Molecular and Ionic Compound Structure and Properties Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 560 chars · sample: `An ionic bond forms when a metal transfers one or more electrons to a nonmetal, `
  * cat[0].clue[1] (value 200) — 682 chars · sample: `Metallic bonding is described by the 'electron sea' or band model: metal cations`
  * cat[0].clue[2] (value 300) — 548 chars · sample: `A polar covalent bond forms between atoms with 0.4 < ΔEN < ~1.7. The more electr`
  * cat[0].clue[3] (value 400) — 600 chars · sample: `A π (pi) bond forms when two unhybridized p orbitals on adjacent atoms overlap s`
  * cat[0].clue[4] (value 500) — 502 chars · sample: `Methane combustion: ΔH ≈ Σ(bonds broken) − Σ(bonds formed). Broken: 4 C-H (4×413`
  * cat[1].clue[0] (value 100) — 604 chars · sample: `Lewis structures, introduced by G.N. Lewis in his 1916 paper 'The Atom and the M`
  * cat[1].clue[1] (value 200) — 580 chars · sample: `Gilbert N. Lewis introduced the covalent (shared-pair) bond model in 1916. Two a`
  * cat[1].clue[2] (value 300) — 541 chars · sample: `The octet rule states that main-group atoms (especially C, N, O, F) tend to achi`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 570 chars

### `games/ap-chemistry/03 - Intermolecular Forces and Properties Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 602 chars · sample: `Dipole-dipole forces arise between polar molecules: the δ⁺ end of one molecule a`
  * cat[0].clue[1] (value 200) — 618 chars · sample: `'Like dissolves like' captures the empirical solubility rule: polar solvents (wa`
  * cat[0].clue[2] (value 300) — 596 chars · sample: `A meniscus is the curved surface of a liquid in a tube, caused by competition be`
  * cat[0].clue[3] (value 400) — 612 chars · sample: `Dipole-induced dipole (Debye) forces occur when a polar molecule distorts the el`
  * cat[0].clue[4] (value 500) — 574 chars · sample: `Johannes van der Waals (Nobel 1910) modified the ideal-gas law to (P + an²/V²)(V`
  * cat[1].clue[0] (value 100) — 595 chars · sample: `London dispersion forces (LDF), described by Fritz London in 1930, are the unive`
  * cat[1].clue[1] (value 200) — 552 chars · sample: `The ideal gas law PV = nRT was assembled by combining Boyle's (1662), Charles's `
  * cat[1].clue[2] (value 300) — 575 chars · sample: `Hydrogen bonds are a strong subset of dipole-dipole interactions, formed when H `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 569 chars

### `games/ap-chemistry/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 592 chars · sample: `The atomic number Z equals the number of protons in the nucleus and uniquely ide`
  * cat[0].clue[1] (value 200) — 561 chars · sample: `Hydrogen bonds are the strongest IMF (5-30 kJ/mol), forming when H is covalently`
  * cat[0].clue[2] (value 300) — 568 chars · sample: `Water's oxygen has four electron domains (2 bonding + 2 lone pairs), so the elec`
  * cat[0].clue[3] (value 400) — 504 chars · sample: `Iron (Fe, Z = 26) has configuration 1s² 2s² 2p⁶ 3s² 3p⁶ 4s² 3d⁶ = [Ar] 4s² 3d⁶. `
  * cat[0].clue[4] (value 500) — 561 chars · sample: `In CO₂ (O=C=O), the central carbon has 2 electron domains (two C=O double bonds)`
  * cat[1].clue[0] (value 100) — 509 chars · sample: `Reaction rate has units of M/s (or mol/(L·s)) — concentration change per unit ti`
  * cat[1].clue[1] (value 200) — 575 chars · sample: `Molality (m) is moles of solute per kilogram of solvent: m = n / m_solvent. Unli`
  * cat[1].clue[2] (value 300) — 630 chars · sample: `Henry's law: solubility of a gas in liquid = k_H × P, where k_H is the Henry's l`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 528 chars

### `games/ap-computer-science-a/02 - Using Objects Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 2.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-a/06 - Array Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 6.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-a/08 - 2D Array Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 8.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 8.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 8.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 8.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 8.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 8.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 8.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 8.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-a/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 2.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 6.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 4.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 18 chars

### `games/ap-english-language/01 - Rhetorical Situation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 638 chars · sample: `Speaker is the persona or voice creating the text, the first letter in the SOAPS`
  * cat[0].clue[1] (value 200) — 608 chars · sample: `Occasion is the time, place, and historical context that prompted the text, the `
  * cat[0].clue[2] (value 300) — 636 chars · sample: `Audience identifies the intended readers or listeners shaping every rhetorical c`
  * cat[0].clue[3] (value 400) — 651 chars · sample: `Purpose is the rhetorical aim or goal an author seeks to achieve - to persuade, `
  * cat[0].clue[4] (value 500) — 662 chars · sample: `Tone is the author's attitude toward the subject - reverent, indignant, ironic, `
  * cat[1].clue[0] (value 100) — 678 chars · sample: `Logos is Aristotle's appeal to logic and reason, one of the three artistic proof`
  * cat[1].clue[1] (value 200) — 677 chars · sample: `Pathos is Aristotle's appeal to emotion, the second of three artistic proofs in `
  * cat[1].clue[2] (value 300) — 704 chars · sample: `Ethos is Aristotle's appeal to credibility, the third artistic proof from his 'R`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 781 chars

### `games/ap-english-language/02 - Claims and Evidence Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 666 chars · sample: `A claim is the central argument or assertion a writer makes - the proposition th`
  * cat[0].clue[1] (value 200) — 681 chars · sample: `A claim of fact asserts that something is or is not the case - a verifiable or e`
  * cat[0].clue[2] (value 300) — 655 chars · sample: `A claim of value asserts that something is good or bad, just or unjust, beautifu`
  * cat[0].clue[3] (value 400) — 692 chars · sample: `A claim of policy asserts that something should or should not be done - a prescr`
  * cat[0].clue[4] (value 500) — 702 chars · sample: `A sub-claim is a supporting claim that develops one aspect of the main thesis, b`
  * cat[1].clue[0] (value 100) — 718 chars · sample: `Statistics are quantitative data supporting a claim - the dominant form of logos`
  * cat[1].clue[1] (value 200) — 691 chars · sample: `An anecdote is an eyewitness account or short personal story used as evidence - `
  * cat[1].clue[2] (value 300) — 711 chars · sample: `Expert testimony is a quotation or citation from an authority figure used as evi`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 916 chars

### `games/ap-english-language/03 - Reasoning and Organization Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 733 chars · sample: `Deductive reasoning moves from general premises to specific conclusions - if the`
  * cat[0].clue[1] (value 200) — 712 chars · sample: `Inductive reasoning moves from specific observations to general conclusions - th`
  * cat[0].clue[2] (value 300) — 684 chars · sample: `A syllogism is a three-part deductive argument with a major premise, minor premi`
  * cat[0].clue[3] (value 400) — 685 chars · sample: `Causal reasoning argues that one event or condition produces another - the workh`
  * cat[0].clue[4] (value 500) — 664 chars · sample: `Analogical reasoning argues by mapping a familiar case onto an unfamiliar one - `
  * cat[1].clue[0] (value 100) — 710 chars · sample: `Ad hominem (Latin: 'to the person') is the fallacy of attacking the speaker rath`
  * cat[1].clue[1] (value 200) — 712 chars · sample: `False cause (post hoc ergo propter hoc, 'after this therefore because of this') `
  * cat[1].clue[2] (value 300) — 729 chars · sample: `Slippery slope is the fallacy of assuming one event will inevitably lead to a ch`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 962 chars

### `games/ap-english-language/06 - Rhetorical Devices Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 755 chars · sample: `Alliteration is the repetition of initial consonant sounds in nearby words - 'wi`
  * cat[0].clue[1] (value 200) — 701 chars · sample: `Anaphora is the repetition of the same word or phrase at the beginning of succes`
  * cat[0].clue[2] (value 300) — 726 chars · sample: `Epistrophe is the repetition of the same word or phrase at the end of successive`
  * cat[0].clue[3] (value 400) — 701 chars · sample: `Chiasmus is a scheme of inverted word order - a phrase or sentence whose second `
  * cat[0].clue[4] (value 500) — 760 chars · sample: `Parallelism is the use of similar grammatical structure for similar ideas - matc`
  * cat[1].clue[0] (value 100) — 711 chars · sample: `Metaphor is a comparison that asserts identity between two unlike things without`
  * cat[1].clue[1] (value 200) — 753 chars · sample: `Simile is an explicit comparison using 'like' or 'as' - similar to metaphor but `
  * cat[1].clue[2] (value 300) — 722 chars · sample: `Personification is the attribution of human qualities to non-human entities - an`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1102 chars

### `games/ap-english-language/07 - Argumentation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 736 chars · sample: `A thesis is the main claim of an essay - the controlling argument the rest of th`
  * cat[0].clue[1] (value 200) — 712 chars · sample: `Support is the evidence backing the claim - the data, examples, expert testimony`
  * cat[0].clue[2] (value 300) — 712 chars · sample: `A warrant is the reasoning principle connecting evidence to claim - the often-un`
  * cat[0].clue[3] (value 400) — 722 chars · sample: `Counterargument is the opposing view acknowledged within one's own argument - ei`
  * cat[0].clue[4] (value 500) — 715 chars · sample: `Refutation is the move of disproving or undermining the counterargument - the ac`
  * cat[1].clue[0] (value 100) — 712 chars · sample: `An argument of fact asserts that something is or is not the case - a verifiable `
  * cat[1].clue[1] (value 200) — 717 chars · sample: `An argument of value asserts that something is good or bad, just or unjust, beau`
  * cat[1].clue[2] (value 300) — 764 chars · sample: `An argument of policy calls for action or change - a prescriptive claim assertin`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1257 chars

### `games/ap-english-language/09 - FRQ Essays and Practice Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 731 chars · sample: `The synthesis essay is the first FRQ on the AP English Language exam - the quest`
  * cat[0].clue[1] (value 200) — 625 chars · sample: `At least three is the minimum number of sources students must incorporate from t`
  * cat[0].clue[2] (value 300) — 720 chars · sample: `Roughly 40 minutes is the recommended time allocation for the synthesis FRQ (Q1)`
  * cat[0].clue[3] (value 400) — 690 chars · sample: `Original argument is the central goal of the synthesis FRQ (Q1): a thesis that i`
  * cat[0].clue[4] (value 500) — 673 chars · sample: `Seven sources is the typical count in the AP synthesis FRQ (Q1) source packet, t`
  * cat[1].clue[0] (value 100) — 714 chars · sample: `Rhetorical analysis is the second FRQ on the AP English Language exam - the ques`
  * cat[1].clue[1] (value 200) — 690 chars · sample: `How the author achieves purpose is the central focus of the rhetorical analysis `
  * cat[1].clue[2] (value 300) — 711 chars · sample: `Analyzing rhetorical choices is the central skill tested by the rhetorical analy`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1108 chars

### `games/ap-english-literature/04 - Short Fiction II Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 600 chars · sample: `Conflict is the struggle between opposing forces that drives narrative. Aristotl`
  * cat[0].clue[1] (value 200) — 572 chars · sample: `Person-versus-person conflict pits one character against another. Iago against O`
  * cat[0].clue[2] (value 300) — 576 chars · sample: `Internal conflict is the struggle within a character's mind between competing im`
  * cat[0].clue[3] (value 400) — 564 chars · sample: `Person-versus-nature conflict pits character against environment. Crane's 'The O`
  * cat[0].clue[4] (value 500) — 564 chars · sample: `Person-versus-society conflict pits character against institutions, conventions,`
  * cat[1].clue[0] (value 100) — 565 chars · sample: `Symbol is a concrete object or image representing an abstract idea. Hawthorne's `
  * cat[1].clue[1] (value 200) — 556 chars · sample: `Motif is a recurring symbolic element — image, phrase, situation — that gathers `
  * cat[1].clue[2] (value 300) — 546 chars · sample: `Allegory is an extended narrative in which characters, events, and settings syst`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 579 chars

### `games/ap-english-literature/06 - Longer Fiction and Drama II Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 567 chars · sample: `Novel is a long fictional prose narrative, typically over 40,000 words, organize`
  * cat[0].clue[1] (value 200) — 591 chars · sample: `Bildungsroman (German: 'novel of formation') traces a young protagonist's moral,`
  * cat[0].clue[2] (value 300) — 553 chars · sample: `Epistolary novel is a narrative told through letters, diary entries, or document`
  * cat[0].clue[3] (value 400) — 538 chars · sample: `Picaresque novel features a roguish, lower-class protagonist (the pícaro) travel`
  * cat[0].clue[4] (value 500) — 545 chars · sample: `Dystopian novel imagines a future or alternate society organized around oppressi`
  * cat[1].clue[0] (value 100) — 550 chars · sample: `Narrator is the voice telling the story, distinct from the author. In novels the`
  * cat[1].clue[1] (value 200) — 579 chars · sample: `First-person narration uses 'I' (or 'we'), restricting the reader to one charact`
  * cat[1].clue[2] (value 300) — 557 chars · sample: `Third-person narration uses 'he,' 'she,' 'they' and stands outside characters. I`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 594 chars

### `games/ap-english-literature/08 - Poetry III Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 584 chars · sample: `Ghazal is a Persian-origin lyric form of independent couplets unified by a refra`
  * cat[0].clue[1] (value 200) — 545 chars · sample: `Haiku is a Japanese three-line lyric form, traditionally five-seven-five syllabl`
  * cat[0].clue[2] (value 300) — 567 chars · sample: `Sestina is a six-stanza poem of six unrhymed lines plus a three-line envoi (39 l`
  * cat[0].clue[3] (value 400) — 535 chars · sample: `Cycle (or sequence) is a sustained series of related poems read together as unif`
  * cat[0].clue[4] (value 500) — 547 chars · sample: `Epic is a long narrative poem of elevated style centered on a hero whose actions`
  * cat[1].clue[0] (value 100) — 567 chars · sample: `Speaker is the persona voicing a poem, distinct from the poet. Browning's dramat`
  * cat[1].clue[1] (value 200) — 538 chars · sample: `Auditor is the implied listener within a poem — the silent recipient of the spea`
  * cat[1].clue[2] (value 300) — 555 chars · sample: `Dramatic monologue is a poem in which a single speaker addresses an implied sile`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 559 chars

### `games/ap-english-literature/09 - Longer Fiction Drama III and FRQ Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 503 chars · sample: `FRQ 1 is the poetry-analysis free-response question on the AP English Literature`
  * cat[0].clue[1] (value 200) — 540 chars · sample: `FRQ 1 (and all three AP Lit FRQs) is allotted 40 minutes of writing time. The to`
  * cat[0].clue[2] (value 300) — 573 chars · sample: `FRQ 1's analytical focus is on the author's craft choices and their effect on me`
  * cat[0].clue[3] (value 400) — 532 chars · sample: `FRQ 1 typically presents one short poem of 20–50 lines, occasionally a brief pai`
  * cat[0].clue[4] (value 500) — 555 chars · sample: `FRQ scores range from 0 to 6 on each question. The 6-point rubric (current as of`
  * cat[1].clue[0] (value 100) — 528 chars · sample: `FRQ 2 is the prose-analysis free-response question on the AP English Literature `
  * cat[1].clue[1] (value 200) — 515 chars · sample: `FRQ 2 prose passages are drawn from fiction or drama — novels, short stories, pl`
  * cat[1].clue[2] (value 300) — 534 chars · sample: `FRQ 2's analytical focus is on the writer's craft — how authorial choices shape `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 550 chars

### `games/ap-environmental-science/01 - Living World: Ecosystems Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 684 chars · sample: `The Sun is the ultimate energy source for nearly all ecosystems on Earth, drivin`
  * cat[0].clue[1] (value 200) — 592 chars · sample: `Photosynthesis: 6 CO2 + 6 H2O + light energy yields C6H12O6 + 6 O2. Discovered b`
  * cat[0].clue[2] (value 300) — 630 chars · sample: `Producers (autotrophs) sit at trophic level 1 and make their own organic compoun`
  * cat[0].clue[3] (value 400) — 616 chars · sample: `Primary consumers (herbivores) occupy trophic level 2, eating producers directly`
  * cat[0].clue[4] (value 500) — 618 chars · sample: `The 10% rule (Raymond Lindeman, 1942) states that only ~10% of the energy at one`
  * cat[1].clue[0] (value 100) — 619 chars · sample: `A food chain is a linear sequence of organisms in which each is eaten by the nex`
  * cat[1].clue[1] (value 200) — 652 chars · sample: `A food web is the interconnected network of multiple food chains in an ecosystem`
  * cat[1].clue[2] (value 300) — 624 chars · sample: `A trophic level is an organism's position in the food chain based on its energy `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 759 chars

### `games/ap-environmental-science/02 - Living World: Biodiversity Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 733 chars · sample: `Biodiversity is the variety of life at three nested scales: genetic diversity (a`
  * cat[0].clue[1] (value 200) — 712 chars · sample: `Species richness is the simple count of different species in a defined area, the`
  * cat[0].clue[2] (value 300) — 675 chars · sample: `Species evenness measures how equitably individuals are distributed among specie`
  * cat[0].clue[3] (value 400) — 754 chars · sample: `Genetic diversity is the variation in alleles within a species — the raw materia`
  * cat[0].clue[4] (value 500) — 808 chars · sample: `Habitat (ecosystem) diversity is the variety of distinct ecosystems within a lar`
  * cat[1].clue[0] (value 100) — 708 chars · sample: `Mutualism is a (+/+) interaction where both species benefit. Classic examples: m`
  * cat[1].clue[1] (value 200) — 728 chars · sample: `Commensalism is a (+/0) interaction where one species benefits and the other is `
  * cat[1].clue[2] (value 300) — 729 chars · sample: `Parasitism is a (+/-) interaction where one organism benefits at the host's expe`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 792 chars

### `games/ap-environmental-science/03 - Populations Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 738 chars · sample: `Exponential growth: dN/dt = rN, where N = population size, r = intrinsic growth `
  * cat[0].clue[1] (value 200) — 635 chars · sample: `Logistic growth: dN/dt = rN(1 - N/K), where K is carrying capacity. Produces an `
  * cat[0].clue[2] (value 300) — 720 chars · sample: `Carrying capacity (K) is the maximum population size an environment can sustaina`
  * cat[0].clue[3] (value 400) — 725 chars · sample: `Overshoot occurs when a population exceeds carrying capacity (N > K) — often due`
  * cat[0].clue[4] (value 500) — 735 chars · sample: `Dieback (population crash) is the rapid mortality following overshoot, returning`
  * cat[1].clue[0] (value 100) — 733 chars · sample: `r-selected species pursue a 'fast-and-many' reproductive strategy: many small of`
  * cat[1].clue[1] (value 200) — 741 chars · sample: `K-selected species pursue a 'slow-and-few' strategy: few large offspring, long l`
  * cat[1].clue[2] (value 300) — 624 chars · sample: `Intrinsic rate of increase (r) is the per-capita growth rate of a population und`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 739 chars

### `games/ap-environmental-science/04 - Earth Systems and Resources Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 729 chars · sample: `Plate tectonics theory holds that Earth's lithosphere is divided into ~15 major `
  * cat[0].clue[1] (value 200) — 703 chars · sample: `Divergent boundaries are where plates move apart and new crust forms. At mid-oce`
  * cat[0].clue[2] (value 300) — 736 chars · sample: `Convergent boundaries are where plates collide. Three types based on plate densi`
  * cat[0].clue[3] (value 400) — 724 chars · sample: `Transform boundaries are where plates slide horizontally past each other; no new`
  * cat[0].clue[4] (value 500) — 721 chars · sample: `Subduction zones are where denser oceanic plates dive beneath less-dense contine`
  * cat[1].clue[0] (value 100) — 752 chars · sample: `Topsoil (A horizon) is the upper mineral soil layer where organic matter mixes w`
  * cat[1].clue[1] (value 200) — 705 chars · sample: `The O (organic) horizon is the topmost soil layer composed primarily of decompos`
  * cat[1].clue[2] (value 300) — 716 chars · sample: `The B horizon (subsoil) is the zone of mineral accumulation, where clay, iron ox`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 771 chars

### `games/ap-environmental-science/05 - Land and Water Use Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 761 chars · sample: `Industrial agriculture is the high-input, high-output production system using sy`
  * cat[0].clue[1] (value 200) — 761 chars · sample: `Monoculture is the practice of growing a single crop variety across large areas.`
  * cat[0].clue[2] (value 300) — 784 chars · sample: `Polyculture grows multiple crop species together — reducing pest pressure, impro`
  * cat[0].clue[3] (value 400) — 729 chars · sample: `Organic farming excludes synthetic fertilizers, pesticides, GMOs, and antibiotic`
  * cat[0].clue[4] (value 500) — 743 chars · sample: `The Green Revolution (1940s-1970s) transformed global agriculture via high-yield`
  * cat[1].clue[0] (value 100) — 777 chars · sample: `Irrigation is the artificial application of water to crops. Globally, irrigation`
  * cat[1].clue[1] (value 200) — 719 chars · sample: `Drip irrigation delivers water directly to plant roots through perforated tubing`
  * cat[1].clue[2] (value 300) — 768 chars · sample: `Salinization is the accumulation of salts in soil from irrigation water containi`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 786 chars

### `games/ap-environmental-science/06 - Energy Resources Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 727 chars · sample: `Coal is sedimentary rock formed from compressed Carboniferous-era (~360-300 Ma) `
  * cat[0].clue[1] (value 200) — 754 chars · sample: `Petroleum (crude oil) is liquid hydrocarbons formed from compressed marine organ`
  * cat[0].clue[2] (value 300) — 723 chars · sample: `Natural gas (primarily CH4) is the cleanest-burning fossil fuel — emits ~50% les`
  * cat[0].clue[3] (value 400) — 783 chars · sample: `Shale gas is natural gas trapped in low-permeability shale formations, extracted`
  * cat[0].clue[4] (value 500) — 795 chars · sample: `Tar (oil) sands are sandstone saturated with bitumen — extremely viscous, heavy `
  * cat[1].clue[0] (value 100) — 737 chars · sample: `Nuclear fission splits heavy atomic nuclei (typically U-235 or Pu-239) into ligh`
  * cat[1].clue[1] (value 200) — 763 chars · sample: `Nuclear fusion combines light nuclei (typically deuterium + tritium yielding hel`
  * cat[1].clue[2] (value 300) — 722 chars · sample: `Uranium-235 is the primary fission fuel. Natural uranium is 99.3% U-238 (non-fis`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 765 chars

### `games/ap-environmental-science/07 - Atmospheric Pollution Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 714 chars · sample: `Carbon monoxide (CO) is an odorless, colorless gas formed by incomplete combusti`
  * cat[0].clue[1] (value 200) — 734 chars · sample: `Sulfur dioxide (SO2) is a colorless, pungent gas released from burning sulfur-co`
  * cat[0].clue[2] (value 300) — 712 chars · sample: `Nitrogen oxides (NOx = NO + NO2) form at high combustion temperatures when atmos`
  * cat[0].clue[3] (value 400) — 765 chars · sample: `PM2.5 is particulate matter <=2.5 micrometers diameter (~1/30 width of a human h`
  * cat[0].clue[4] (value 500) — 805 chars · sample: `Photochemical smog (summer/'Los Angeles' smog) forms when NOx (from vehicle exha`
  * cat[1].clue[0] (value 100) — 722 chars · sample: `Secondhand smoke (environmental tobacco smoke, ETS) is the involuntary inhalatio`
  * cat[1].clue[1] (value 200) — 721 chars · sample: `Radon-222 (half-life 3.8 days) is a radioactive noble gas formed by uranium-238 `
  * cat[1].clue[2] (value 300) — 745 chars · sample: `Asbestos is a group of six naturally occurring silicate minerals (chrysotile mos`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 853 chars

### `games/ap-environmental-science/08 - Aquatic and Terrestrial Pollution Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 738 chars · sample: `Water pollution is the contamination of water bodies (rivers, lakes, groundwater`
  * cat[0].clue[1] (value 200) — 768 chars · sample: `Point-source pollution enters water from a single identifiable discharge point —`
  * cat[0].clue[2] (value 300) — 733 chars · sample: `Nonpoint-source pollution comes from diffuse, hard-to-track sources: agricultura`
  * cat[0].clue[3] (value 400) — 798 chars · sample: `Eutrophication is the over-enrichment of water with nutrients (N, P) causing exp`
  * cat[0].clue[4] (value 500) — 767 chars · sample: `Dissolved oxygen (DO) is O2 dissolved in water, essential for aerobic aquatic li`
  * cat[1].clue[0] (value 100) — 765 chars · sample: `Primary sewage treatment is mechanical/physical: screening removes large debris `
  * cat[1].clue[1] (value 200) — 770 chars · sample: `Secondary sewage treatment uses aerobic bacteria to biologically decompose organ`
  * cat[1].clue[2] (value 300) — 826 chars · sample: `Tertiary (advanced) sewage treatment removes specific dissolved pollutants left `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 823 chars

### `games/ap-environmental-science/09 - Global Change Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 730 chars · sample: `Climate change refers to long-term shifts in Earth's temperature, precipitation,`
  * cat[0].clue[1] (value 200) — 777 chars · sample: `CO2 is the dominant anthropogenic GHG — responsible for ~76% of human-caused war`
  * cat[0].clue[2] (value 300) — 721 chars · sample: `Thermal expansion contributes ~50% of observed sea-level rise (about 1.4 mm/yr o`
  * cat[0].clue[3] (value 400) — 786 chars · sample: `Coastal flooding from sea-level rise threatens ~600 million people globally livi`
  * cat[0].clue[4] (value 500) — 801 chars · sample: `The Intergovernmental Panel on Climate Change (IPCC) was established 1988 by UNE`
  * cat[1].clue[0] (value 100) — 759 chars · sample: `Ocean acidification is the decline of seawater pH due to absorption of atmospher`
  * cat[1].clue[1] (value 200) — 823 chars · sample: `Coral reefs are most threatened by ocean acidification AND ocean warming (a doub`
  * cat[1].clue[2] (value 300) — 797 chars · sample: `Coral bleaching is the stress response where coral polyps expel their symbiotic `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 847 chars

### `games/ap-environmental-science/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 769 chars · sample: `Biodiversity encompasses three nested scales: genetic diversity within species, `
  * cat[0].clue[1] (value 200) — 783 chars · sample: `Approximately 90% of energy is lost as metabolic heat (cellular respiration, Sec`
  * cat[0].clue[2] (value 300) — 793 chars · sample: `Photosynthesis converts solar energy to chemical energy: 6 CO2 + 6 H2O + light y`
  * cat[0].clue[3] (value 400) — 764 chars · sample: `Carrying capacity (K) is the maximum population size an environment can sustaina`
  * cat[0].clue[4] (value 500) — 769 chars · sample: `Extinction is the permanent loss of all members of a species. Background rate ~1`
  * cat[1].clue[0] (value 100) — 730 chars · sample: `Natural gas (CH4) emits ~50% less CO2 per unit energy than coal and no SO2 or me`
  * cat[1].clue[1] (value 200) — 815 chars · sample: `Nuclear fission splits heavy atomic nuclei (U-235 or Pu-239) into lighter fragme`
  * cat[1].clue[2] (value 300) — 807 chars · sample: `Solar photovoltaic (PV) converts sunlight directly to electricity via the photoe`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 865 chars

### `games/ap-french-language/01 - Families and Communities Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 646 chars · sample: `La famille is a foundational AP French Language theme. In Francophone cultures, `
  * cat[0].clue[1] (value 200) — 651 chars · sample: `Le PACS (pacte civil de solidarité, 1999) is a key AP French Language interpreti`
  * cat[0].clue[2] (value 300) — 679 chars · sample: `Le foyer multigénérationnel (or la famille élargie) is more common in immigrant `
  * cat[0].clue[3] (value 400) — 642 chars · sample: `Élever means to raise or rear children in AP French Language vocabulary; éduquer`
  * cat[0].clue[4] (value 500) — 694 chars · sample: `Le fossé générationnel (generational gap) is a recurring AP French Language inte`
  * cat[1].clue[0] (value 100) — 657 chars · sample: `Le quartier is more than a neighborhood; it is an emotional and social unit in F`
  * cat[1].clue[1] (value 200) — 646 chars · sample: `Le bénévolat is critical AP French Language vocabulary appearing in interpersona`
  * cat[1].clue[2] (value 300) — 736 chars · sample: `La laïcité is a foundational AP French Language Republican value, codified in 19`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 567 chars

### `games/ap-french-language/02 - Personal and Public Identities Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 622 chars · sample: `Les valeurs anchor AP French Language essays on identité. Common valeurs: l'honn`
  * cat[0].clue[1] (value 200) — 640 chars · sample: `La fierté (pride) is layered AP French Language vocabulary: la fierté nationale,`
  * cat[0].clue[2] (value 300) — 633 chars · sample: `L'estime de soi appears in AP French Language interpretive sources about identit`
  * cat[0].clue[3] (value 400) — 627 chars · sample: `L'identité nationale is a contested AP French Language interpretive topic. The 2`
  * cat[0].clue[4] (value 500) — 626 chars · sample: `Le biculturalisme describes a person navigating two cultural systems, a major AP`
  * cat[1].clue[0] (value 100) — 627 chars · sample: `La personnalité is the AP French Language vocabulary for character traits. Commo`
  * cat[1].clue[1] (value 200) — 596 chars · sample: `Le héros (masc.) and l'héroïne (fem.) describe admired individuals on the AP Fre`
  * cat[1].clue[2] (value 300) — 620 chars · sample: `Appartenir à is the AP French Language verb for belonging to a community or grou`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 557 chars

### `games/ap-french-language/03 - Beauty and Aesthetics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 591 chars · sample: `Le tableau (or la peinture) is core AP French Language visual arts vocabulary. R`
  * cat[0].clue[1] (value 200) — 701 chars · sample: `Claude Monet (1840-1926) is the AP French Language paradigmatic Impressionist. T`
  * cat[0].clue[2] (value 300) — 598 chars · sample: `Victor Hugo (1802-1885) is the AP French Language paradigmatic 19th-century Fren`
  * cat[0].clue[3] (value 400) — 665 chars · sample: `Notre-Dame de Paris is a foundational AP French Language Gothic cathedral on Île`
  * cat[0].clue[4] (value 500) — 650 chars · sample: `Le repas is the AP French Language paradigmatic social-cultural ritual. The trad`
  * cat[1].clue[0] (value 100) — 625 chars · sample: `L'œuvre littéraire is core AP French Language vocabulary for any literary text. `
  * cat[1].clue[1] (value 200) — 605 chars · sample: `Édith Piaf (1915-1963) is the AP French Language paradigmatic mid-century chante`
  * cat[1].clue[2] (value 300) — 649 chars · sample: `Albert Camus (1913-1960) is an AP French Language major Francophone author. L'Ét`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 560 chars

### `games/ap-french-language/04 - Science and Technology Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 644 chars · sample: `Le portable (or le téléphone portable, le smartphone) is core AP French Language`
  * cat[0].clue[1] (value 200) — 637 chars · sample: `Internet (or le Net, la toile) is critical AP French Language vocabulary. Verbs:`
  * cat[0].clue[2] (value 300) — 625 chars · sample: `Marie Curie (1867-1934) is the AP French Language paradigmatic woman scientist. `
  * cat[0].clue[3] (value 400) — 653 chars · sample: `L'intelligence artificielle (IA) is a frequent AP French Language interpretive t`
  * cat[0].clue[4] (value 500) — 650 chars · sample: `L'éthique scientifique and la bioéthique are key AP French Language interpretive`
  * cat[1].clue[0] (value 100) — 628 chars · sample: `Louis Pasteur (1822-1895) is a foundational AP French Language Francophone scien`
  * cat[1].clue[1] (value 200) — 618 chars · sample: `Le vaccin is AP French Language vocabulary used extensively in interpretive sour`
  * cat[1].clue[2] (value 300) — 635 chars · sample: `La pandémie (COVID-19, 2020-) is omnipresent in AP French Language interpretive `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 593 chars

### `games/ap-french-language/05 - Contemporary Life Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 611 chars · sample: `L'école is core AP French Language vocabulary. Related: la maternelle (preschool`
  * cat[0].clue[1] (value 200) — 646 chars · sample: `Le baccalauréat (le bac) is the AP French Language paradigmatic French national `
  * cat[0].clue[2] (value 300) — 680 chars · sample: `La philosophie is required of all French lycéens in Terminale, a foundational AP`
  * cat[0].clue[3] (value 400) — 660 chars · sample: `L'école publique, laïque, gratuite et obligatoire (free, secular, mandatory publ`
  * cat[0].clue[4] (value 500) — 656 chars · sample: `Les classes préparatoires aux grandes écoles (CPGE, or les prépas) are the AP Fr`
  * cat[1].clue[0] (value 100) — 656 chars · sample: `Le travail (or l'emploi) is core AP French Language vocabulary. Related: la prof`
  * cat[1].clue[1] (value 200) — 669 chars · sample: `Les 35 heures (35-hour workweek) is a paradigmatic AP French Language labor poli`
  * cat[1].clue[2] (value 300) — 617 chars · sample: `Le télétravail (or le travail à distance) became a key AP French Language interp`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 600 chars

### `games/ap-french-language/06 - Global Challenges Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 656 chars · sample: `La planète and la Terre are core AP French Language vocabulary for environmental`
  * cat[0].clue[1] (value 200) — 678 chars · sample: `La pollution is high-frequency AP French Language vocabulary. Types: pollution d`
  * cat[0].clue[2] (value 300) — 624 chars · sample: `Emmanuel Macron (born 1977) is the AP French Language current French president, `
  * cat[0].clue[3] (value 400) — 669 chars · sample: `La biodiversité is a major AP French Language environmental concept. France's ov`
  * cat[0].clue[4] (value 500) — 650 chars · sample: `Les énergies renouvelables are a positive AP French Language interpretive theme.`
  * cat[1].clue[0] (value 100) — 667 chars · sample: `Les droits humains (les droits de l'homme et du citoyen) are foundational AP Fre`
  * cat[1].clue[1] (value 200) — 630 chars · sample: `Les réfugiés are a key AP French Language interpretive topic. France hosts ~530,`
  * cat[1].clue[2] (value 300) — 646 chars · sample: `La frontière européenne is central to AP French Language interpretive sources ab`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 533 chars

### `games/ap-german-language/01 - Families and Communities Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 17 chars · sample: `AP German Unit 1.`
  * cat[0].clue[1] (value 200) — 17 chars · sample: `AP German Unit 1.`
  * cat[0].clue[2] (value 300) — 17 chars · sample: `AP German Unit 1.`
  * cat[0].clue[3] (value 400) — 17 chars · sample: `AP German Unit 1.`
  * cat[0].clue[4] (value 500) — 17 chars · sample: `AP German Unit 1.`
  * cat[1].clue[0] (value 100) — 17 chars · sample: `AP German Unit 1.`
  * cat[1].clue[1] (value 200) — 17 chars · sample: `AP German Unit 1.`
  * cat[1].clue[2] (value 300) — 17 chars · sample: `AP German Unit 1.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 17 chars

### `games/ap-latin/02 - Vergil Aeneid Book 2 Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 2.`
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 2.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 2.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 2.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 2.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 2.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 2.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 2.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-latin/03 - Vergil Aeneid Book 4 Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 3.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-latin/04 - Vergil Aeneid Book 6 Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 4.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-latin/05 - Vergil Aeneid Books 8, 10-12 Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 5.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-latin/07 - Caesar BG Books 4 and 5 Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 7.`
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 7.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 7.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 7.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 7.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 7.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 7.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 7.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-latin/09 - Translation, Scansion, Devices Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 9.`
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 9.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 9.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 9.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 9.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 9.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 9.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 9.`
  * ... and 17 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-macroeconomics/03 - Unit 3 National Income and Price Determination Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 591 chars · sample: `Aggregate demand (AD) is the total planned spending on final goods and services `
  * cat[0].clue[1] (value 200) — 553 chars · sample: `The AD curve plots the total quantity of real GDP demanded (C + I + G + NX) at e`
  * cat[0].clue[2] (value 300) — 523 chars · sample: `Aggregate supply (AS) is the total quantity of real output producers are willing`
  * cat[0].clue[3] (value 400) — 545 chars · sample: `Short-run aggregate supply (SRAS) shows the positive relationship between the pr`
  * cat[0].clue[4] (value 500) — 543 chars · sample: `A demand shock is a sudden, unexpected change in aggregate demand — the AD curve`
  * cat[1].clue[0] (value 100) — 558 chars · sample: `The SRAS curve shows the total quantity of output supplied at each price level w`
  * cat[1].clue[1] (value 200) — 586 chars · sample: `Fiscal policy is the use of government spending (G) and taxation (T) to influenc`
  * cat[1].clue[2] (value 300) — 573 chars · sample: `The tax multiplier measures the impact of a lump-sum tax change on equilibrium r`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 525 chars

### `games/ap-macroeconomics/04 - Unit 4 Financial Sector Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 587 chars · sample: `The reserve ratio = Bank Reserves / Total Deposits. It has two components: the r`
  * cat[0].clue[1] (value 200) — 590 chars · sample: `Required reserves = Required Reserve Ratio × Total Deposits. They are the legall`
  * cat[0].clue[2] (value 300) — 551 chars · sample: `The money supply (MS) is the total amount of money in circulation, measured by M`
  * cat[0].clue[3] (value 400) — 546 chars · sample: `The reserve requirement (required reserve ratio, RRR) is the legal minimum fract`
  * cat[0].clue[4] (value 500) — 553 chars · sample: `Commercial banks are depository institutions that accept deposits, extend loans,`
  * cat[1].clue[0] (value 100) — 554 chars · sample: `Money creation occurs when commercial banks lend out a portion of deposits, whic`
  * cat[1].clue[1] (value 200) — 540 chars · sample: `Open market operations (OMO) are the Fed's primary monetary policy tool: the FOM`
  * cat[1].clue[2] (value 300) — 589 chars · sample: `Deposit insurance is a government guarantee — in the U.S., the FDIC (Federal Dep`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 574 chars

### `games/ap-macroeconomics/05 - Unit 5 Long-Run Consequences of Stabilization Policies Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 583 chars · sample: `The long-run Phillips curve (LRPC) is vertical at the natural rate of unemployme`
  * cat[0].clue[1] (value 200) — 578 chars · sample: `The short-run Phillips curve (SRPC) shows an inverse relationship between inflat`
  * cat[0].clue[2] (value 300) — 573 chars · sample: `Crowding out occurs when government borrowing to finance a deficit raises real i`
  * cat[0].clue[3] (value 400) — 605 chars · sample: `The crowding-out effect is illustrated using the loanable funds graph: when the `
  * cat[0].clue[4] (value 500) — 645 chars · sample: `The loanable funds market model determines the equilibrium real interest rate wh`
  * cat[1].clue[0] (value 100) — 557 chars · sample: `The natural rate of unemployment (NRU) is the unemployment rate when the economy`
  * cat[1].clue[1] (value 200) — 554 chars · sample: `The Phillips curve, first described by A.W. Phillips (1958) using UK data, showe`
  * cat[1].clue[2] (value 300) — 598 chars · sample: `Contractionary fiscal policy uses decreases in government spending (↓G) or incre`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 594 chars

### `games/ap-music-theory/06 - Harmony and Voice Leading III Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 564 chars · sample: `Non-chord tones (NCTs): notes outside the underlying chord, creating melodic emb`
  * cat[0].clue[1] (value 200) — 517 chars · sample: `Passing tone (PT): approached by step, left by step in SAME direction. Connects `
  * cat[0].clue[2] (value 300) — 569 chars · sample: `Neighbor tone (NT): approached by step, returning to original pitch by step (in `
  * cat[0].clue[3] (value 400) — 558 chars · sample: `Arpeggiation: melodic line outlining notes of a chord in succession. Example: C-`
  * cat[0].clue[4] (value 500) — 627 chars · sample: `Suspension: a NCT prepared by a previous chord tone (now consonant), TIED or rep`
  * cat[1].clue[0] (value 100) — 630 chars · sample: `Anticipation: NCT that 'anticipates' the next chord tone - arrives early. Approa`
  * cat[1].clue[1] (value 200) — 534 chars · sample: `Escape tone (échappée): approached by step (usually up), left by leap (usually d`
  * cat[1].clue[2] (value 300) — 585 chars · sample: `Retardation: like suspension but resolves UP instead of down. Prepared (held ove`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 619 chars

### `games/ap-music-theory/08 - Modes and Form Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 553 chars · sample: `Ionian mode: same as major scale. Interval pattern W-W-H-W-W-W-H. Identical to m`
  * cat[0].clue[1] (value 200) — 583 chars · sample: `Mixolydian: W-W-H-W-W-H-W (major with lowered 7). G Mixolydian: G-A-B-C-D-E-F-G `
  * cat[0].clue[2] (value 300) — 610 chars · sample: `Kind of Blue (1959): Miles Davis album launching modal jazz. Avoided chord progr`
  * cat[0].clue[3] (value 400) — 608 chars · sample: `Claude Debussy (1862-1918): French Impressionist composer. Extensively used mode`
  * cat[0].clue[4] (value 500) — 502 chars · sample: `Lydian: W-W-W-H-W-W-H (major with raised 4). F Lydian: F-G-A-B-C-D-E-F (white ke`
  * cat[1].clue[0] (value 100) — 540 chars · sample: `Binary form: two contrasting sections (A and B). Standard structure: A (in tonic`
  * cat[1].clue[1] (value 200) — 569 chars · sample: `Ternary form: three sections - A (in tonic), B (contrasting key/material), A (re`
  * cat[1].clue[2] (value 300) — 578 chars · sample: `Strophic form: same music repeats for each verse (each 'strophe' or stanza). Dif`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 734 chars

### `games/ap-physics-1/03 - Work, Energy, Power Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 610 chars · sample: `Work W = F * d * cos(theta) (joules), the scalar product of force and displaceme`
  * cat[0].clue[1] (value 200) — 547 chars · sample: `W = F d cos(theta) (joules), where F is force magnitude (N), d is displacement m`
  * cat[0].clue[2] (value 300) — 578 chars · sample: `Joule (J) = 1 N * m = 1 kg * m^2 / s^2. Named after James Prescott Joule (1818-1`
  * cat[0].clue[3] (value 400) — 593 chars · sample: `Work done by kinetic friction is ALWAYS negative: W_f = -f_k * d (joules), where`
  * cat[0].clue[4] (value 500) — 563 chars · sample: `Work in vertical motion: W = F_y * Delta y (joules), where F_y is the vertical f`
  * cat[1].clue[0] (value 100) — 581 chars · sample: `Kinetic energy KE = (1/2) m v^2 (joules) is the energy associated with motion. A`
  * cat[1].clue[1] (value 200) — 524 chars · sample: `KE = (1/2) m v^2 (joules), with m in kg and v in m/s. The (1/2) factor arises fr`
  * cat[1].clue[2] (value 300) — 549 chars · sample: `Work-Energy Theorem: W_net = Delta KE = KE_f - KE_i (joules). Net work done on a`
  * ... and 16 more
* **clue-too-terse** (1)
  * cat[1].clue[4] (value 500) — 8 chars · sample: `KE sign.`
* **final-explanation-too-verbose** (1)
  * final — 559 chars

### `games/ap-physics-1/07 - Oscillations Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 617 chars · sample: `Simple harmonic motion (SHM): motion under a linear restoring force F = -k x, wi`
  * cat[0].clue[1] (value 200) — 600 chars · sample: `Hooke's Law: F = -k x (newtons), where k is the spring constant (N/m) and x is d`
  * cat[0].clue[2] (value 300) — 524 chars · sample: `Spring constant k unit: N/m (newtons per meter) — the force per unit displacemen`
  * cat[0].clue[3] (value 400) — 546 chars · sample: `Amplitude A (meters) is the maximum displacement from equilibrium in SHM. The po`
  * cat[0].clue[4] (value 500) — 574 chars · sample: `Period T (seconds) is the time for one complete oscillation cycle. For mass-on-s`
  * cat[1].clue[0] (value 100) — 553 chars · sample: `Frequency f (Hz = 1/s) is the number of complete oscillation cycles per second. `
  * cat[1].clue[1] (value 200) — 579 chars · sample: `Hertz (Hz) = 1 cycle / second = 1/s. Named after Heinrich Hertz (1857-1894), who`
  * cat[1].clue[2] (value 300) — 572 chars · sample: `Mass-on-spring period: T = 2 pi sqrt(m/k) (seconds), with m in kg and k in N/m. `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 622 chars

### `games/ap-physics-1/08 - Fluids Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 539 chars · sample: `Density rho = m / V (kg/m^3) — mass per unit volume. Water at 4 °C: rho = 1000 k`
  * cat[0].clue[1] (value 200) — 586 chars · sample: `Pressure P = F / A (Pa = N/m^2), force exerted perpendicular to a surface divide`
  * cat[0].clue[2] (value 300) — 571 chars · sample: `Pascal (Pa) = 1 N/m^2 = 1 kg / (m * s^2). Named after Blaise Pascal (1623-1662),`
  * cat[0].clue[3] (value 400) — 642 chars · sample: `Hydrostatic pressure: P(h) = P_0 + rho g h (Pa), where h is depth below the surf`
  * cat[0].clue[4] (value 500) — 629 chars · sample: `Standard atmospheric pressure: P_atm = 1.013 * 10^5 Pa = 101,325 Pa = 1 atm = 76`
  * cat[1].clue[0] (value 100) — 581 chars · sample: `Buoyancy F_b is the upward force exerted by a fluid on any submerged object, ari`
  * cat[1].clue[1] (value 200) — 622 chars · sample: `Archimedes' principle: the buoyant force equals the weight of the fluid displace`
  * cat[1].clue[2] (value 300) — 532 chars · sample: `A floating object is in equilibrium: F_b = F_g, so rho_fluid V_displaced g = m g`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 718 chars

### `games/ap-physics-2/01 - Fluids Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 616 chars · sample: `Density rho = m / V (kg/m^3) — mass per unit volume. Water: rho = 1000 kg/m^3. A`
  * cat[0].clue[1] (value 200) — 625 chars · sample: `Pressure P = F / A (Pa = N/m^2), force exerted perpendicular to a surface per un`
  * cat[0].clue[2] (value 300) — 600 chars · sample: `Pascal (Pa) = 1 N/m^2 = 1 kg / (m * s^2). Named after Blaise Pascal (1623-1662),`
  * cat[0].clue[3] (value 400) — 571 chars · sample: `Hydrostatic pressure: P(h) = P_0 + rho g h (Pa), where h is depth, rho is fluid `
  * cat[0].clue[4] (value 500) — 574 chars · sample: `In an incompressible fluid (typical liquid), pressure increases LINEARLY with de`
  * cat[1].clue[0] (value 100) — 608 chars · sample: `Buoyancy F_b is the upward force on any submerged object due to the pressure dif`
  * cat[1].clue[1] (value 200) — 652 chars · sample: `Archimedes' principle: the buoyant force equals the weight of the fluid displace`
  * cat[1].clue[2] (value 300) — 576 chars · sample: `A floating object is in equilibrium: F_b = F_g. Setting rho_fluid V_disp g = m g`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 705 chars

### `games/ap-physics-2/02 - Thermodynamics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 633 chars · sample: `Temperature T (Kelvin) is proportional to the average translational kinetic ener`
  * cat[0].clue[1] (value 200) — 571 chars · sample: `Kelvin (K) — the SI absolute temperature scale, with zero at absolute zero and 1`
  * cat[0].clue[2] (value 300) — 631 chars · sample: `Absolute zero: T = 0 K = -273.15 °C = -459.67 °F. The lowest theoretically achie`
  * cat[0].clue[3] (value 400) — 624 chars · sample: `Heat Q (joules) is energy transferred from a higher-temperature body to a lower-`
  * cat[0].clue[4] (value 500) — 608 chars · sample: `Specific heat capacity c unit: J/(kg * K). Q = m c Delta T (joules), where m is `
  * cat[1].clue[0] (value 100) — 602 chars · sample: `Ideal gas law: PV = nRT (Pa * m^3 = J), where P is pressure (Pa), V volume (m^3)`
  * cat[1].clue[1] (value 200) — 625 chars · sample: `Universal gas constant R = 8.314 J/(mol*K) = 0.0821 L*atm/(mol*K). Appears in PV`
  * cat[1].clue[2] (value 300) — 593 chars · sample: `Isobaric process: pressure constant (Delta P = 0) while V and T change. Charles'`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 641 chars

### `games/ap-physics-2/03 - Electric Force, Field, Potential Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 652 chars · sample: `Coulomb's law (Charles-Augustin de Coulomb, 1785): the electrostatic force betwe`
  * cat[0].clue[1] (value 200) — 634 chars · sample: `F = k q_1 q_2 / r^2 (N), where k = 8.99 * 10^9 N*m^2/C^2, q_1 and q_2 are charge`
  * cat[0].clue[2] (value 300) — 629 chars · sample: `Coulomb's constant k = 8.99 * 10^9 N*m^2/C^2 (often approximated 9 * 10^9 on AP)`
  * cat[0].clue[3] (value 400) — 581 chars · sample: `Coulomb (C) — SI unit of electric charge. 1 C = current of 1 A flowing for 1 s. `
  * cat[0].clue[4] (value 500) — 636 chars · sample: `Electron charge q_e = -1.602 * 10^-19 C (often approximated -1.6 * 10^-19 on AP)`
  * cat[1].clue[0] (value 100) — 650 chars · sample: `Electric field E = F / q_test (N/C or V/m) — force per unit test charge. Vector `
  * cat[1].clue[1] (value 200) — 600 chars · sample: `Electric field unit: N/C (newtons per coulomb), equivalent to V/m (volts per met`
  * cat[1].clue[2] (value 300) — 617 chars · sample: `Electric field of a point charge: E = k Q / r^2 (N/C), magnitude only, directed `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 652 chars

### `games/ap-physics-2/04 - Electric Circuits Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 639 chars · sample: `Ohm's Law: V = I R (volts), with V the voltage drop across a resistor (V), I the`
  * cat[0].clue[1] (value 200) — 601 chars · sample: `Ohm (Ω) = 1 V/A — SI unit of electrical resistance. Named after Georg Simon Ohm `
  * cat[0].clue[2] (value 300) — 628 chars · sample: `Ampere (A) = 1 C/s — SI unit of electric current. Named after André-Marie Ampère`
  * cat[0].clue[3] (value 400) — 616 chars · sample: `Electric current I = dq/dt (amperes), the rate of charge flow past a point. Conv`
  * cat[0].clue[4] (value 500) — 633 chars · sample: `Power dissipated by a resistor: P = V^2 / R (watts), equivalently P = I^2 R = V `
  * cat[1].clue[0] (value 100) — 616 chars · sample: `Series connection: components arranged end-to-end so the same current flows thro`
  * cat[1].clue[1] (value 200) — 633 chars · sample: `Series resistance: R_eq = R_1 + R_2 + ... + R_n (Ohm). Resistances add directly `
  * cat[1].clue[2] (value 300) — 660 chars · sample: `Current is the SAME at every point in a series circuit (no junctions for charge `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 706 chars

### `games/ap-physics-2/05 - Magnetism and Electromagnetic Induction Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 623 chars · sample: `Lorentz force on a moving charge: F = q v x B (newtons), with v velocity (m/s) a`
  * cat[0].clue[1] (value 200) — 611 chars · sample: `Magnetic force magnitude on a moving charge: F = q v B sin(theta), where q is ch`
  * cat[0].clue[2] (value 300) — 558 chars · sample: `Tesla (T) = 1 N/(A*m) = 1 kg/(A*s^2) = 1 Wb/m^2 — SI unit of magnetic field B. N`
  * cat[0].clue[3] (value 400) — 652 chars · sample: `Force on a current-carrying wire in a magnetic field: F = B I L sin(theta) (N), `
  * cat[0].clue[4] (value 500) — 631 chars · sample: `Right-hand rule for magnetic force F = q v x B: for positive charge, point finge`
  * cat[1].clue[0] (value 100) — 612 chars · sample: `Magnetic field of long straight wire: B = mu_0 I / (2 pi r) (T), at perpendicula`
  * cat[1].clue[1] (value 200) — 647 chars · sample: `Magnetic field inside a long solenoid: B = mu_0 n I (T), where n is turns per un`
  * cat[1].clue[2] (value 300) — 611 chars · sample: `Solenoid parameter n = N/L (turns per meter), with N total turns and L solenoid `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 719 chars

### `games/ap-physics-2/06 - Geometric and Physical Optics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 645 chars · sample: `Law of reflection: angle of incidence = angle of reflection (both measured from `
  * cat[0].clue[1] (value 200) — 687 chars · sample: `Refraction: bending of light as it passes from one medium to another with a diff`
  * cat[0].clue[2] (value 300) — 634 chars · sample: `Snell's Law: n_1 sin(theta_1) = n_2 sin(theta_2), where n is the refractive inde`
  * cat[0].clue[3] (value 400) — 666 chars · sample: `Refractive index of vacuum: n = 1 (exactly, by definition). Defined as n = c/v, `
  * cat[0].clue[4] (value 500) — 676 chars · sample: `Critical angle: theta_c = arcsin(n_2/n_1), where light goes from medium 1 (dense`
  * cat[1].clue[0] (value 100) — 683 chars · sample: `Curved mirror: spherical-section mirror, either concave (reflective surface inwa`
  * cat[1].clue[1] (value 200) — 573 chars · sample: `Mirror (and thin-lens) equation: 1/f = 1/d_o + 1/d_i, where f is focal length, d`
  * cat[1].clue[2] (value 300) — 641 chars · sample: `Magnification m = h_i / h_o = -d_i / d_o (dimensionless), where h_i, h_o are ima`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 699 chars

### `games/ap-physics-2/07 - Quantum, Atomic, Nuclear Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 687 chars · sample: `Photon: the elementary particle (quantum) of electromagnetic radiation. Energy E`
  * cat[0].clue[1] (value 200) — 635 chars · sample: `Photon energy: E = h f (joules), where h = 6.626 * 10^-34 J*s is Planck's consta`
  * cat[0].clue[2] (value 300) — 621 chars · sample: `Planck's constant h = 6.626 * 10^-34 J*s (or 4.136 * 10^-15 eV*s — useful for at`
  * cat[0].clue[3] (value 400) — 751 chars · sample: `Wave-particle duality: light (and all quantum entities) exhibit both wave-like (`
  * cat[0].clue[4] (value 500) — 699 chars · sample: `Photon momentum: p = h / lambda = h f / c = E / c (kg*m/s). Compton (1923) verif`
  * cat[1].clue[0] (value 100) — 742 chars · sample: `Photoelectric effect: light striking a metal surface ejects electrons (photoelec`
  * cat[1].clue[1] (value 200) — 661 chars · sample: `Work function phi (joules or eV) — the minimum energy required to liberate an el`
  * cat[1].clue[2] (value 300) — 685 chars · sample: `Einstein's photoelectric equation: KE_max = h f - phi (joules), the maximum kine`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 688 chars

### `games/ap-physics-c-mechanics/01 - Kinematics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 646 chars · sample: `Velocity is defined as the time derivative of position: v(t) = dx/dt, a calculus`
  * cat[0].clue[1] (value 200) — 621 chars · sample: `Acceleration is the time derivative of velocity: a(t) = dv/dt = d^2x/dt^2, makin`
  * cat[0].clue[2] (value 300) — 627 chars · sample: `Position x(t) is recovered from velocity by antidifferentiation: x(t) = x_0 + in`
  * cat[0].clue[3] (value 400) — 626 chars · sample: `Velocity is recovered from acceleration by antidifferentiation: v(t) = v_0 + int`
  * cat[0].clue[4] (value 500) — 613 chars · sample: `The kinematic equation x = x_0 + v_0*t + (1/2)*a*t^2 holds for constant accelera`
  * cat[1].clue[0] (value 100) — 633 chars · sample: `The vector position equation r(t) = r_0 + v_0*t + (1/2)*a*t^2 generalizes 1D con`
  * cat[1].clue[1] (value 200) — 647 chars · sample: `In projectile motion under gravity alone, the horizontal velocity component v_x `
  * cat[1].clue[2] (value 300) — 656 chars · sample: `The vertical acceleration of a projectile is g directed downward (a_y = -g ≈ -9.`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 793 chars

### `games/ap-physics-c-mechanics/02 - Newton's Laws Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 706 chars · sample: `Newton's first law of motion (law of inertia) states that an object at rest stay`
  * cat[0].clue[1] (value 200) — 649 chars · sample: `Newton's second law states that the net force on an object equals the time rate `
  * cat[0].clue[2] (value 300) — 666 chars · sample: `Newton's third law states that for every action there is an equal and opposite r`
  * cat[0].clue[3] (value 400) — 641 chars · sample: `Newton's second law in momentum form is F = dp/dt, the most general statement va`
  * cat[0].clue[4] (value 500) — 714 chars · sample: `An inertial reference frame is one in which Newton's first law holds without inv`
  * cat[1].clue[0] (value 100) — 697 chars · sample: `The rocket equation, also called the Tsiolkovsky rocket equation (Konstantin Tsi`
  * cat[1].clue[1] (value 200) — 639 chars · sample: `Thrust force on a rocket is F_thrust = -v_e * dm/dt, the rate of momentum transf`
  * cat[1].clue[2] (value 300) — 646 chars · sample: `Momentum is conserved in rocket motion when the system (rocket + propellant) exp`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 709 chars

### `games/ap-physics-c-mechanics/03 - Work, Energy, Power Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 695 chars · sample: `Work done by a force is W = integral of F . dr along the path of motion, a line `
  * cat[0].clue[1] (value 200) — 676 chars · sample: `Work done by a constant force on an object undergoing displacement d at angle th`
  * cat[0].clue[2] (value 300) — 638 chars · sample: `The Work-Energy Theorem states W_net = delta KE, the net work done on an object `
  * cat[0].clue[3] (value 400) — 585 chars · sample: `Work done by a spring from x = 0 to x = x_f is W_spring = -(1/2)*k*x_f^2, derive`
  * cat[0].clue[4] (value 500) — 623 chars · sample: `Instantaneous power is P = dW/dt, the time rate of doing work, with SI unit watt`
  * cat[1].clue[0] (value 100) — 673 chars · sample: `A conservative force is one whose total work around any closed loop is zero, equ`
  * cat[1].clue[1] (value 200) — 640 chars · sample: `Potential energy from a conservative force is U(x) = -integral of F(x)dx + const`
  * cat[1].clue[2] (value 300) — 591 chars · sample: `Force is the negative gradient of potential energy: F = -dU/dx (1D), or F = -gra`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 844 chars

### `games/ap-physics-c-mechanics/04 - Systems and Linear Momentum Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 684 chars · sample: `The center of mass (COM) of a system is the mass-weighted average position: r_CO`
  * cat[0].clue[1] (value 200) — 638 chars · sample: `The COM position formula is r_COM = (Sigma m_i * r_i) / M_total, summing each pa`
  * cat[0].clue[2] (value 300) — 669 chars · sample: `Velocity of the center of mass is v_COM = (Sigma m_i * v_i) / M_total, the mass-`
  * cat[0].clue[3] (value 400) — 677 chars · sample: `The net external force on a system changes the center-of-mass acceleration: F_ex`
  * cat[0].clue[4] (value 500) — 609 chars · sample: `In the absence of net external force, the center of mass moves with constant vel`
  * cat[1].clue[0] (value 100) — 610 chars · sample: `Linear momentum p = m*v is the product of mass and velocity, a vector quantity w`
  * cat[1].clue[1] (value 200) — 587 chars · sample: `Total momentum of an isolated system (no external forces) is conserved: P_total `
  * cat[1].clue[2] (value 300) — 623 chars · sample: `Newton's second law in momentum form is F = dp/dt, the most general statement co`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 769 chars

### `games/ap-physics-c-mechanics/05 - Rotation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 651 chars · sample: `Angular position is theta (Greek letter), measured in radians from a chosen refe`
  * cat[0].clue[1] (value 200) — 648 chars · sample: `Angular velocity is omega = d(theta)/dt, the time derivative of angular position`
  * cat[0].clue[2] (value 300) — 641 chars · sample: `Angular acceleration is alpha = d(omega)/dt = d^2(theta)/dt^2, the time derivati`
  * cat[0].clue[3] (value 400) — 662 chars · sample: `Tangential velocity at a point on a rotating rigid body at radius r is v_t = r*o`
  * cat[0].clue[4] (value 500) — 698 chars · sample: `Tangential acceleration at a point on a rotating body is a_t = r*alpha, the line`
  * cat[1].clue[0] (value 100) — 636 chars · sample: `Torque is the rotational analog of force - the agent that produces angular accel`
  * cat[1].clue[1] (value 200) — 661 chars · sample: `Torque vector is tau = r x F, where r is the position vector from the rotation a`
  * cat[1].clue[2] (value 300) — 628 chars · sample: `Torque magnitude is tau = r*F*sin(theta), where theta is the angle between the p`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 729 chars

### `games/ap-physics-c-mechanics/06 - Oscillations Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 679 chars · sample: `Simple harmonic motion (SHM) is oscillatory motion in which the restoring force `
  * cat[0].clue[1] (value 200) — 645 chars · sample: `The SHM differential equation is d^2x/dt^2 + omega^2*x = 0, derived from Newton'`
  * cat[0].clue[2] (value 300) — 668 chars · sample: `The general solution to the SHM ODE x'' + omega^2*x = 0 is x(t) = A*cos(omega*t `
  * cat[0].clue[3] (value 400) — 619 chars · sample: `Angular frequency of a spring-mass oscillator is omega = sqrt(k/m), with units r`
  * cat[0].clue[4] (value 500) — 692 chars · sample: `Period of a spring-mass oscillator is T = 2*pi*sqrt(m/k), with units seconds. De`
  * cat[1].clue[0] (value 100) — 646 chars · sample: `A pendulum is a mass suspended on a string or rigid rod that swings under gravit`
  * cat[1].clue[1] (value 200) — 656 chars · sample: `Period of a simple pendulum is T = 2*pi*sqrt(L/g), where L is the length and g i`
  * cat[1].clue[2] (value 300) — 654 chars · sample: `The small-angle approximation sin(theta) ≈ theta (with theta in radians) is esse`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 810 chars

### `games/ap-physics-c-mechanics/07 - Gravitation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 664 chars · sample: `Newton's law of universal gravitation states that every pair of masses attracts `
  * cat[0].clue[1] (value 200) — 646 chars · sample: `The gravitation force formula is F = G*m_1*m_2/r^2, an inverse-square law derive`
  * cat[0].clue[2] (value 300) — 676 chars · sample: `The gravitational constant G ≈ 6.67 x 10^-11 N*m^2/kg^2, determined by Henry Cav`
  * cat[0].clue[3] (value 400) — 633 chars · sample: `The inverse-square law form F proportional to 1/r^2 means that doubling the dist`
  * cat[0].clue[4] (value 500) — 743 chars · sample: `Henry Cavendish's torsion-balance experiment (1798) measured the gravitational c`
  * cat[1].clue[0] (value 100) — 639 chars · sample: `Gravitational field g is the acceleration a test mass experiences at a point - a`
  * cat[1].clue[1] (value 200) — 614 chars · sample: `Gravitational acceleration g at Earth's surface is approximately 9.8 m/s^2 (more`
  * cat[1].clue[2] (value 300) — 631 chars · sample: `Gravitational field magnitude from a point mass M at distance r is g(r) = G*M/r^`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 965 chars

### `games/ap-spanish-language/01 - Families and Communities Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 617 chars · sample: `La familia is a foundational AP Spanish Language theme. In many Hispanic culture`
  * cat[0].clue[1] (value 200) — 570 chars · sample: `Las tradiciones familiares appear constantly in AP Spanish Language sources, esp`
  * cat[0].clue[2] (value 300) — 580 chars · sample: `Los padrinos (godparents) and the broader system of compadrazgo are key Hispanic`
  * cat[0].clue[3] (value 400) — 599 chars · sample: `Criar means to raise or rear children, while educar means to formally instruct o`
  * cat[0].clue[4] (value 500) — 706 chars · sample: `La familia extendida (extended family) and the hogar multigeneracional (multigen`
  * cat[1].clue[0] (value 100) — 579 chars · sample: `On AP Spanish Language interpersonal writing tasks (email replies), formal greet`
  * cat[1].clue[1] (value 200) — 584 chars · sample: `El voluntariado and el servicio comunitario appear in AP Spanish Language interp`
  * cat[1].clue[2] (value 300) — 573 chars · sample: `La migración urbana and el éxodo rural are essential AP Spanish Language concept`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 624 chars

### `games/ap-spanish-language/02 - Personal and Public Identities Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 567 chars · sample: `La personalidad is the AP Spanish Language vocabulary for one's character traits`
  * cat[0].clue[1] (value 200) — 599 chars · sample: `Los valores (values) and los principios (principles) anchor AP Spanish Language `
  * cat[0].clue[2] (value 300) — 614 chars · sample: `El lenguaje inclusivo is a contested AP Spanish Language topic. Strategies inclu`
  * cat[0].clue[3] (value 400) — 596 chars · sample: `Frida Kahlo (1907-1954) is a major AP Spanish Language héroe cultural and femini`
  * cat[0].clue[4] (value 500) — 638 chars · sample: `El orgullo (pride) is a layered AP Spanish Language concept: orgullo nacional, o`
  * cat[1].clue[0] (value 100) — 591 chars · sample: `El multiculturalismo and la diversidad cultural describe the coexistence of mult`
  * cat[1].clue[1] (value 200) — 581 chars · sample: `Las metas personales and los objetivos personales appear constantly on AP Spanis`
  * cat[1].clue[2] (value 300) — 625 chars · sample: `El prejuicio (prejudice) and los estereotipos (stereotypes) appear in AP Spanish`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 504 chars

### `games/ap-spanish-language/03 - Beauty and Aesthetics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 628 chars · sample: `El cuadro (or la pintura) is core AP Spanish Language vocabulary for visual arts`
  * cat[0].clue[1] (value 200) — 641 chars · sample: `Salvador Dalí (1904-1989) is a high-frequency AP Spanish Language artista españo`
  * cat[0].clue[2] (value 300) — 583 chars · sample: `Diego Velázquez (1599-1660) is the towering AP Spanish Language Golden Age paint`
  * cat[0].clue[3] (value 400) — 597 chars · sample: `Fernando Botero (1932-2023) is a major AP Spanish Language Latin American artist`
  * cat[0].clue[4] (value 500) — 645 chars · sample: `El Bosco (Hieronymus Bosch, c.1450-1516) is a recurring AP Spanish Language Gold`
  * cat[1].clue[0] (value 100) — 581 chars · sample: `La obra literaria is AP Spanish Language vocabulary for any literary text. Relat`
  * cat[1].clue[1] (value 200) — 614 chars · sample: `Miguel de Cervantes (1547-1616) is a foundational AP Spanish Language author. Do`
  * cat[1].clue[2] (value 300) — 651 chars · sample: `Gabriel García Márquez (1927-2014), nicknamed Gabo, is a central AP Spanish Lang`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 529 chars

### `games/ap-spanish-language/04 - Science and Technology Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 612 chars · sample: `El teléfono móvil (Spain) or el celular (Latin America) is core AP Spanish Langu`
  * cat[0].clue[1] (value 200) — 619 chars · sample: `El Internet (or la red) is critical AP Spanish Language vocabulary. Verbs: naveg`
  * cat[0].clue[2] (value 300) — 637 chars · sample: `La inteligencia artificial (IA) is a frequent AP Spanish Language interpretive t`
  * cat[0].clue[3] (value 400) — 652 chars · sample: `La ética científica and la bioética are key AP Spanish Language interpretive top`
  * cat[0].clue[4] (value 500) — 612 chars · sample: `La brecha digital (digital divide) is a high-frequency AP Spanish Language CED c`
  * cat[1].clue[0] (value 100) — 654 chars · sample: `La innovación is high-frequency AP Spanish Language vocabulary. Related: el inve`
  * cat[1].clue[1] (value 200) — 612 chars · sample: `La vacuna is AP Spanish Language vocabulary used extensively in interpretive sou`
  * cat[1].clue[2] (value 300) — 666 chars · sample: `La deforestación is a critical AP Spanish Language environmental concept. Source`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 546 chars

### `games/ap-spanish-language/05 - Contemporary Life Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 628 chars · sample: `La escuela (escuela primaria) and el colegio (often secondary) are core AP Spani`
  * cat[0].clue[1] (value 200) — 614 chars · sample: `La educación universitaria gratuita is a key AP Spanish Language interpretive to`
  * cat[0].clue[2] (value 300) — 675 chars · sample: `La educación bilingüe is a frequent AP Spanish Language interpretive topic. Sour`
  * cat[0].clue[3] (value 400) — 645 chars · sample: `La brecha salarial de género is a key AP Spanish Language feminist and labor top`
  * cat[0].clue[4] (value 500) — 624 chars · sample: `La enseñanza híbrida and la educación a distancia (distance learning) became cen`
  * cat[1].clue[0] (value 100) — 641 chars · sample: `El trabajo (or el empleo) is core AP Spanish Language vocabulary. Related: la pr`
  * cat[1].clue[1] (value 200) — 574 chars · sample: `La Selectividad (officially EvAU or PAU) is the Spanish high-stakes university e`
  * cat[1].clue[2] (value 300) — 640 chars · sample: `El teletrabajo (or trabajo a distancia) became a key AP Spanish Language interpr`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 571 chars

### `games/ap-spanish-language/06 - Global Challenges Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 658 chars · sample: `El planeta and la Tierra are core AP Spanish Language vocabulary for environment`
  * cat[0].clue[1] (value 200) — 649 chars · sample: `La contaminación is high-frequency AP Spanish Language vocabulary. Types: contam`
  * cat[0].clue[2] (value 300) — 651 chars · sample: `La corrupción is a recurring AP Spanish Language interpretive topic. Sources dis`
  * cat[0].clue[3] (value 400) — 616 chars · sample: `El reciclaje and las tres erres (reducir, reutilizar, reciclar) are core AP Span`
  * cat[0].clue[4] (value 500) — 686 chars · sample: `El Mercosur (Mercado Común del Sur) is a major AP Spanish Language regional inte`
  * cat[1].clue[0] (value 100) — 658 chars · sample: `Los derechos humanos are a central AP Spanish Language unit 6 concept. The 1948 `
  * cat[1].clue[1] (value 200) — 661 chars · sample: `La democracia is core AP Spanish Language political vocabulary. Spain (1978 cons`
  * cat[1].clue[2] (value 300) — 658 chars · sample: `Los desaparecidos refer to victims of forced disappearance under Latin American `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 572 chars

### `games/ap-spanish-language/99 - AP Spanish Language Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 570 chars · sample: `Ser describes permanent identity (origin, profession, time, relationship); estar`
  * cat[0].clue[1] (value 200) — 677 chars · sample: `Sin embargo is the most useful adversative connector for AP Spanish Language ess`
  * cat[0].clue[2] (value 300) — 601 chars · sample: `Pretérito for completed/bounded actions; imperfecto for ongoing/habitual/descrip`
  * cat[0].clue[3] (value 400) — 527 chars · sample: `Por for: Duration, Reason/cause, Exchange, Around/through, Means, Substitution (`
  * cat[0].clue[4] (value 500) — 625 chars · sample: `Indicativo for objective facts/known reality; subjuntivo for subjectivity. WEIRD`
  * cat[1].clue[0] (value 100) — 582 chars · sample: `Las familias y las comunidades is Theme 1 of the AP Spanish Language CED, coveri`
  * cat[1].clue[1] (value 200) — 554 chars · sample: `Las identidades personales y públicas is Theme 2 of the AP Spanish Language CED,`
  * cat[1].clue[2] (value 300) — 531 chars · sample: `La belleza y la estética is Theme 3 of the AP Spanish Language CED, covering Vel`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 754 chars

### `games/ap-spanish-literature/01 - Las Sociedades en Contacto Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 713 chars · sample: `Hernán Cortés (1485-1547) is the AP Spanish Literature required author whose Car`
  * cat[0].clue[1] (value 200) — 658 chars · sample: `La carta de relación is the AP Spanish Literature genre of Cortés's writings. Th`
  * cat[0].clue[2] (value 300) — 629 chars · sample: `Moctezuma II (~1466-1520) is the Aztec tlatoani who receives Cortés in la Segund`
  * cat[0].clue[3] (value 400) — 655 chars · sample: `Tenochtitlán was the Aztec imperial capital, ~200,000 inhabitants, built on an i`
  * cat[0].clue[4] (value 500) — 651 chars · sample: `Malinche (or Doña Marina, ~1500-~1529) was Cortés's indigenous translator, mistr`
  * cat[1].clue[0] (value 100) — 654 chars · sample: `Álvar Núñez Cabeza de Vaca (~1490-~1559) is the AP Spanish Literature required a`
  * cat[1].clue[1] (value 200) — 696 chars · sample: `Naufragios (1542; originally La relación) is the AP Spanish Literature required `
  * cat[1].clue[2] (value 300) — 709 chars · sample: `Curandero (healer) is the AP Spanish Literature role Cabeza de Vaca assumes amon`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 594 chars

### `games/ap-spanish-literature/02 - La Construcción del Género Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 659 chars · sample: `Sor Juana Inés de la Cruz (1648/51-1695) is a foundational AP Spanish Literature`
  * cat[0].clue[1] (value 200) — 691 chars · sample: `La Respuesta a Sor Filotea (1691) is Sor Juana's AP Spanish Literature autobiogr`
  * cat[0].clue[2] (value 300) — 667 chars · sample: `La metáfora is the AP Spanish Literature device that establishes implicit equiva`
  * cat[0].clue[3] (value 400) — 639 chars · sample: `La métrica is the AP Spanish Literature study of syllable count in verse. Spanis`
  * cat[0].clue[4] (value 500) — 663 chars · sample: `La redondilla is a Spanish Golden Age stanza of four 8-syllable lines (octosylla`
  * cat[1].clue[0] (value 100) — 647 chars · sample: `Emilia Pardo Bazán (1851-1921) is a foundational AP Spanish Literature required `
  * cat[1].clue[1] (value 200) — 688 chars · sample: `Las medias rojas (1914) is Pardo Bazán's AP Spanish Literature required short st`
  * cat[1].clue[2] (value 300) — 675 chars · sample: `El patriarcado rural in Pardo Bazán's AP Spanish Literature Las medias rojas ref`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 656 chars

### `games/ap-spanish-literature/03 - El Tiempo y el Espacio Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 670 chars · sample: `El romance is the AP Spanish Literature foundational popular verse form: octosyl`
  * cat[0].clue[1] (value 200) — 649 chars · sample: `El tiempo (time) is part of Theme 3 of the AP Spanish Literature CED. Categories`
  * cat[0].clue[2] (value 300) — 679 chars · sample: `El espacio (space) is the other half of Theme 3 in the AP Spanish Literature CED`
  * cat[0].clue[3] (value 400) — 714 chars · sample: `In medias res is the AP Spanish Literature classical narrative technique that me`
  * cat[0].clue[4] (value 500) — 682 chars · sample: `El Romancero is the AP Spanish Literature term for the corpus of Spanish ballads`
  * cat[1].clue[0] (value 100) — 636 chars · sample: `Francisco de Quevedo (1580-1645) is an AP Spanish Literature foundational Spanis`
  * cat[1].clue[1] (value 200) — 636 chars · sample: `Salmo XVII (Miré los muros de la patria mía) is the AP Spanish Literature requir`
  * cat[1].clue[2] (value 300) — 712 chars · sample: `El desengaño is the central AP Spanish Literature Spanish Baroque concept. After`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 576 chars

### `games/ap-spanish-literature/04 - Las Relaciones Interpersonales Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 736 chars · sample: `La novela picaresca is the AP Spanish Literature genre originated by El Lazarill`
  * cat[0].clue[1] (value 200) — 695 chars · sample: `El ciego (the blind beggar) is Lazarillo's AP Spanish Literature first master in`
  * cat[0].clue[2] (value 300) — 677 chars · sample: `El clérigo de Maqueda is Lazarillo's AP Spanish Literature second master in the `
  * cat[0].clue[3] (value 400) — 689 chars · sample: `El escudero is Lazarillo's AP Spanish Literature third master in the Tratado ter`
  * cat[0].clue[4] (value 500) — 681 chars · sample: `El arcipreste de San Salvador is Lazarillo's AP Spanish Literature final master `
  * cat[1].clue[0] (value 100) — 729 chars · sample: `El pueblo (the village) is the AP Spanish Literature collective protagonist of L`
  * cat[1].clue[1] (value 200) — 709 chars · sample: `Laurencia is the AP Spanish Literature female protagonist of Fuenteovejuna. Init`
  * cat[1].clue[2] (value 300) — 691 chars · sample: `El Comendador Fernán Gómez is the AP Spanish Literature antagonist of Lope's Fue`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 630 chars

### `games/ap-spanish-literature/05 - La Dualidad del Ser Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 650 chars · sample: `Gustavo Adolfo Bécquer (1836-1870) is the AP Spanish Literature foundational Spa`
  * cat[0].clue[1] (value 200) — 656 chars · sample: `Rima IV (No digáis que agotado su tesoro) is Bécquer's AP Spanish Literature req`
  * cat[0].clue[2] (value 300) — 667 chars · sample: `Lo inefable (the ineffable) is the AP Spanish Literature Romantic theme that wha`
  * cat[0].clue[3] (value 400) — 697 chars · sample: `La anáfora is the AP Spanish Literature poetic device Bécquer uses centrally in `
  * cat[0].clue[4] (value 500) — 683 chars · sample: `El desengaño romántico is the AP Spanish Literature Bécquer counterpart to the B`
  * cat[1].clue[0] (value 100) — 653 chars · sample: `Rubén Darío (1867-1916) is the AP Spanish Literature foundational modernismo poe`
  * cat[1].clue[1] (value 200) — 641 chars · sample: `A Roosevelt (1905) is Darío's AP Spanish Literature required poem from Cantos de`
  * cat[1].clue[2] (value 300) — 728 chars · sample: `El modernismo is the AP Spanish Literature late-19th to early-20th century liter`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 520 chars

### `games/ap-spanish-literature/06 - La Creación Literaria Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 677 chars · sample: `Miguel de Cervantes (1547-1616) is the AP Spanish Literature foundational author`
  * cat[0].clue[1] (value 200) — 635 chars · sample: `Don Quijote (born Alonso Quijano) is the AP Spanish Literature protagonist of Ce`
  * cat[0].clue[2] (value 300) — 722 chars · sample: `La parodia is the AP Spanish Literature technique Cervantes uses in Don Quijote `
  * cat[0].clue[3] (value 400) — 693 chars · sample: `Sancho Panza is the AP Spanish Literature loyal squire of Don Quijote. A pragmat`
  * cat[0].clue[4] (value 500) — 736 chars · sample: `El manuscrito encontrado is the AP Spanish Literature metafictional technique ce`
  * cat[1].clue[0] (value 100) — 624 chars · sample: `Pablo Neruda (1904-1973) is an AP Spanish Literature towering Chilean poet. Won `
  * cat[1].clue[1] (value 200) — 707 chars · sample: `Walking around (1933) is Neruda's AP Spanish Literature required poem from Resid`
  * cat[1].clue[2] (value 300) — 721 chars · sample: `El surrealismo is the AP Spanish Literature movement influencing Neruda's Walkin`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 608 chars

### `games/ap-statistics/01 - Exploring One-Variable Data Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 662 chars · sample: `The arithmetic mean x-bar = (Sigma x_i)/n is the most common measure of center, `
  * cat[0].clue[1] (value 200) — 638 chars · sample: `The median is the middle value of an ordered data set (the 50th percentile, Q2 i`
  * cat[0].clue[2] (value 300) — 609 chars · sample: `The mode is the most frequently occurring value in a data set. Distributions can`
  * cat[0].clue[3] (value 400) — 593 chars · sample: `The interquartile range IQR = Q3 - Q1 measures the spread of the middle 50 perce`
  * cat[0].clue[4] (value 500) — 659 chars · sample: `Variance measures the average squared deviation from the mean. Sample variance s`
  * cat[1].clue[0] (value 100) — 679 chars · sample: `A symmetric distribution has mean equal to median - the two sides of the distrib`
  * cat[1].clue[1] (value 200) — 605 chars · sample: `Right-skewed (positively skewed) distributions have a long right tail - extreme `
  * cat[1].clue[2] (value 300) — 676 chars · sample: `Left-skewed (negatively skewed) distributions have a long left tail - extreme lo`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 689 chars

### `games/ap-statistics/02 - Exploring Two-Variable Data Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 754 chars · sample: `A scatterplot displays the relationship between two quantitative variables, with`
  * cat[0].clue[1] (value 200) — 754 chars · sample: `The explanatory (or independent) variable, conventionally placed on the horizont`
  * cat[0].clue[2] (value 300) — 714 chars · sample: `The response (dependent) variable, conventionally plotted on the vertical (y) ax`
  * cat[0].clue[3] (value 400) — 706 chars · sample: `Form describes the geometric pattern in a scatterplot: linear (straight line), c`
  * cat[0].clue[4] (value 500) — 676 chars · sample: `Correlation r (Pearson, 1896) measures the strength and direction of a LINEAR re`
  * cat[1].clue[0] (value 100) — 669 chars · sample: `The symbol r denotes the sample correlation coefficient, also called Pearson's r`
  * cat[1].clue[1] (value 200) — 622 chars · sample: `When r is close to +1, the two variables have a strong positive LINEAR relations`
  * cat[1].clue[2] (value 300) — 636 chars · sample: `When r is close to 0, there is little or NO linear association between x and y. `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 722 chars

### `games/ap-statistics/03 - Collecting Data Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 693 chars · sample: `A Simple Random Sample (SRS) is one in which every individual in the population `
  * cat[0].clue[1] (value 200) — 697 chars · sample: `A stratified random sample divides the population into homogeneous subgroups (st`
  * cat[0].clue[2] (value 300) — 665 chars · sample: `A cluster sample divides the population into heterogeneous clusters (e.g., class`
  * cat[0].clue[3] (value 400) — 635 chars · sample: `A systematic sample selects every kth individual from an ordered list, after cho`
  * cat[0].clue[4] (value 500) — 716 chars · sample: `A convenience sample selects individuals based on ease of access - e.g., samplin`
  * cat[1].clue[0] (value 100) — 708 chars · sample: `Undercoverage occurs when some groups in the population are systematically exclu`
  * cat[1].clue[1] (value 200) — 651 chars · sample: `Non-response bias occurs when individuals selected for the sample refuse to resp`
  * cat[1].clue[2] (value 300) — 690 chars · sample: `Wording bias (also called question wording or response bias from question design`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 793 chars

### `games/ap-statistics/04 - Probability, Random Variables, Distributions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 641 chars · sample: `Probability is the long-run relative frequency of an event - the proportion of t`
  * cat[0].clue[1] (value 200) — 613 chars · sample: `P(A or B) - the probability that event A occurs, B occurs, or both - is computed`
  * cat[0].clue[2] (value 300) — 564 chars · sample: `P(A and B) - the probability that BOTH events occur - is computed by the general`
  * cat[0].clue[3] (value 400) — 588 chars · sample: `Conditional probability P(A|B) is the probability of A given B has occurred: P(A`
  * cat[0].clue[4] (value 500) — 700 chars · sample: `Mutually exclusive events (or disjoint events) cannot both occur simultaneously `
  * cat[1].clue[0] (value 100) — 655 chars · sample: `Two events A and B are INDEPENDENT if the occurrence of one does not affect the `
  * cat[1].clue[1] (value 200) — 646 chars · sample: `When A and B are independent events, the multiplication rule simplifies to P(A a`
  * cat[1].clue[2] (value 300) — 614 chars · sample: `The general multiplication rule P(A and B) = P(A) * P(B|A) applies whether or no`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 785 chars

### `games/ap-statistics/05 - Sampling Distributions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 641 chars · sample: `The sampling distribution of p-hat is the probability distribution of the sample`
  * cat[0].clue[1] (value 200) — 660 chars · sample: `The mean of the sampling distribution of p-hat is exactly p - the population pro`
  * cat[0].clue[2] (value 300) — 592 chars · sample: `The standard deviation of the sampling distribution of p-hat is sigma_p-hat = sq`
  * cat[0].clue[3] (value 400) — 598 chars · sample: `The Large Counts condition requires both np >= 10 AND n(1-p) >= 10 to use the No`
  * cat[0].clue[4] (value 500) — 665 chars · sample: `The 10 percent condition (also called the independence condition) requires that `
  * cat[1].clue[0] (value 100) — 643 chars · sample: `The sampling distribution of x-bar is the probability distribution of the sample`
  * cat[1].clue[1] (value 200) — 600 chars · sample: `The mean of the sampling distribution of x-bar is exactly mu - the population me`
  * cat[1].clue[2] (value 300) — 600 chars · sample: `The standard deviation of the sampling distribution of x-bar is sigma_x-bar = si`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 851 chars

### `games/ap-statistics/08 - Chi-Square Inference Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 695 chars · sample: `The chi-square goodness-of-fit test compares observed counts to expected counts `
  * cat[0].clue[1] (value 200) — 675 chars · sample: `The chi-square test statistic is chi-square = Sigma((O - E)^2 / E), where O is t`
  * cat[0].clue[2] (value 300) — 607 chars · sample: `Degrees of freedom for a chi-square goodness-of-fit test is k - 1, where k is th`
  * cat[0].clue[3] (value 400) — 612 chars · sample: `The Large Expected Counts condition requires every expected count E_i >= 5 to us`
  * cat[0].clue[4] (value 500) — 672 chars · sample: `When the chi-square statistic is large (P-value < alpha), the conclusion is to R`
  * cat[1].clue[0] (value 100) — 658 chars · sample: `The chi-square test of independence assesses whether two categorical variables a`
  * cat[1].clue[1] (value 200) — 619 chars · sample: `A two-way table (or contingency table) cross-classifies two categorical variable`
  * cat[1].clue[2] (value 300) — 606 chars · sample: `Degrees of freedom for a chi-square independence test on an r by c table is df =`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 772 chars

### `games/ap-statistics/09 - Inference for Slopes Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 638 chars · sample: `Slope inference is the chi-square or t-based testing of the population slope bet`
  * cat[0].clue[1] (value 200) — 590 chars · sample: `The test statistic for slope inference is t = (b - beta_0) / SE_b, where b is th`
  * cat[0].clue[2] (value 300) — 567 chars · sample: `Degrees of freedom for slope inference is n - 2, where n is the number of (x, y)`
  * cat[0].clue[3] (value 400) — 598 chars · sample: `The confidence interval for the slope beta is b plus or minus t*-times-SE_b, whe`
  * cat[0].clue[4] (value 500) — 637 chars · sample: `The null hypothesis for slope inference is H0: beta = 0 - testing whether there `
  * cat[1].clue[0] (value 100) — 652 chars · sample: `The LINER conditions for regression inference are: Linear (relationship between `
  * cat[1].clue[1] (value 200) — 627 chars · sample: `The Linear condition is checked using the SCATTERPLOT of y vs x. AP Statistics U`
  * cat[1].clue[2] (value 300) — 629 chars · sample: `The Equal SD condition is checked using the RESIDUAL PLOT - the scatter should h`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 830 chars

### `games/ap-us-government/05 - Unit 5 Political Participation Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 558 chars · sample: `Voter turnout measures the percentage of eligible voters (or voting-age populati`
  * cat[0].clue[1] (value 200) — 583 chars · sample: `A primary election is used to select a party's nominee for a general election. C`
  * cat[0].clue[2] (value 300) — 546 chars · sample: `A caucus is a meeting-based method of selecting party delegates or nominees, whe`
  * cat[0].clue[3] (value 400) — 599 chars · sample: `The Electoral College is the constitutional mechanism — Article II, Section 1 an`
  * cat[0].clue[4] (value 500) — 590 chars · sample: `Winner-take-all (or first-past-the-post) is the U.S. electoral rule in which the`
  * cat[1].clue[0] (value 100) — 586 chars · sample: `A political party is an organization that seeks to win elections and control gov`
  * cat[1].clue[1] (value 200) — 535 chars · sample: `Party realignment is a durable shift in the underlying partisan loyalties of a s`
  * cat[1].clue[2] (value 300) — 556 chars · sample: `Linkage institutions are the channels through which citizens' preferences and de`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 647 chars

### `games/chemistry-regents/03 - Bonding Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 584 chars · sample: `An ionic bond forms when a metal transfers one or more electrons to a nonmetal, `
  * cat[0].clue[1] (value 200) — 596 chars · sample: `A covalent bond is formed when two nonmetal atoms share one or more pairs of ele`
  * cat[0].clue[2] (value 300) — 612 chars · sample: `Metallic bonding pictures positive metal ions arranged in a lattice, surrounded `
  * cat[0].clue[3] (value 400) — 532 chars · sample: `A polar covalent bond forms between atoms with an electronegativity difference b`
  * cat[0].clue[4] (value 500) — 535 chars · sample: `A nonpolar covalent bond forms when two atoms share electrons equally—their elec`
  * cat[1].clue[0] (value 100) — 587 chars · sample: `Lewis dot diagrams (or electron-dot structures) represent valence electrons as d`
  * cat[1].clue[1] (value 200) — 519 chars · sample: `A shared pair (bonding pair) consists of two electrons—one typically contributed`
  * cat[1].clue[2] (value 300) — 530 chars · sample: `A lone pair (nonbonding pair) is a pair of valence electrons not shared between `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 652 chars

### `games/chemistry-regents/04 - Behavior of Matter Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 586 chars · sample: `Solids have definite shape and volume because their particles are held in fixed `
  * cat[0].clue[1] (value 200) — 611 chars · sample: `Liquids have definite volume but take the shape of their container because their`
  * cat[0].clue[2] (value 300) — 591 chars · sample: `Gases have neither definite shape nor definite volume—they expand to fill any co`
  * cat[0].clue[3] (value 400) — 612 chars · sample: `Plasma is a high-energy state in which atoms have been stripped of electrons, pr`
  * cat[0].clue[4] (value 500) — 610 chars · sample: `Phase change is a physical transformation between solid, liquid, and gas states.`
  * cat[1].clue[0] (value 100) — 612 chars · sample: `Kinetic molecular theory (KMT), developed by Boltzmann, Maxwell, and Clausius in`
  * cat[1].clue[1] (value 200) — 568 chars · sample: `Temperature is a measure of the average kinetic energy of the particles in a sub`
  * cat[1].clue[2] (value 300) — 545 chars · sample: `Average kinetic energy (KE_avg = ½ mv²_avg) of particles is directly proportiona`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 585 chars

### `games/chemistry-regents/05 - Solutions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 613 chars · sample: `The solute is the substance dissolved in a solvent to form a solution. In saltwa`
  * cat[0].clue[1] (value 200) — 612 chars · sample: `The solvent is the substance that does the dissolving—usually present in greater`
  * cat[0].clue[2] (value 300) — 625 chars · sample: `An aqueous solution has water as the solvent. The notation (aq) appears in chemi`
  * cat[0].clue[3] (value 400) — 637 chars · sample: `A saturated solution contains the maximum amount of solute that will dissolve at`
  * cat[0].clue[4] (value 500) — 635 chars · sample: `An unsaturated solution contains less solute than its maximum capacity at that t`
  * cat[1].clue[0] (value 100) — 563 chars · sample: `Molarity (M) is the most common concentration unit in chemistry: M = moles of so`
  * cat[1].clue[1] (value 200) — 589 chars · sample: `Parts per million (ppm) measures very low concentrations: ppm = (grams solute / `
  * cat[1].clue[2] (value 300) — 615 chars · sample: `The dilution equation, M₁V₁ = M₂V₂, calculates how concentration changes when mo`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 614 chars

### `games/chemistry-regents/06 - Kinetics and Equilibrium Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 619 chars · sample: `Reaction rate measures how fast a reaction proceeds, usually expressed as moles `
  * cat[0].clue[1] (value 200) — 629 chars · sample: `Activation energy (Ea) is the minimum energy reactant particles must have to ove`
  * cat[0].clue[2] (value 300) — 628 chars · sample: `A catalyst speeds up a reaction by providing an alternative pathway with lower a`
  * cat[0].clue[3] (value 400) — 701 chars · sample: `Collision theory states that reactions occur when reactant particles collide wit`
  * cat[0].clue[4] (value 500) — 704 chars · sample: `An effective collision satisfies two conditions: (1) total kinetic energy ≥ acti`
  * cat[1].clue[0] (value 100) — 625 chars · sample: `A potential energy (PE) diagram plots PE on the y-axis versus reaction progress `
  * cat[1].clue[1] (value 200) — 613 chars · sample: `An exothermic reaction releases energy to the surroundings as heat, making the s`
  * cat[1].clue[2] (value 300) — 575 chars · sample: `An endothermic reaction absorbs energy from the surroundings, making them cooler`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 641 chars

### `games/chemistry-regents/08 - Redox and Electrochemistry Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 610 chars · sample: `Oxidation state (or oxidation number) is the hypothetical charge assigned to an `
  * cat[0].clue[1] (value 200) — 610 chars · sample: `Oxidation is the loss of electrons—the oxidized substance's oxidation state incr`
  * cat[0].clue[2] (value 300) — 588 chars · sample: `Reduction is the gain of electrons—the reduced substance's oxidation state decre`
  * cat[0].clue[3] (value 400) — 558 chars · sample: `An oxidizing agent (or oxidant) is the substance that causes another to be oxidi`
  * cat[0].clue[4] (value 500) — 573 chars · sample: `A reducing agent (or reductant) is the substance that causes another to be reduc`
  * cat[1].clue[0] (value 100) — 613 chars · sample: `A half-reaction shows only the oxidation or the reduction part of a redox reacti`
  * cat[1].clue[1] (value 200) — 652 chars · sample: `Electron transfer is the defining feature of redox: one species loses electrons `
  * cat[1].clue[2] (value 300) — 553 chars · sample: `A balanced redox equation has both mass and charge balanced. To balance: (1) wri`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 673 chars

### `games/chemistry-regents/09 - Organic Chemistry Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 638 chars · sample: `An alkane is a saturated hydrocarbon containing only single bonds between carbon`
  * cat[0].clue[1] (value 200) — 585 chars · sample: `An alkene is an unsaturated hydrocarbon containing at least one carbon-carbon do`
  * cat[0].clue[2] (value 300) — 568 chars · sample: `An alkyne is an unsaturated hydrocarbon containing at least one carbon-carbon tr`
  * cat[0].clue[3] (value 400) — 675 chars · sample: `Aromatic compounds contain a benzene ring (C₆H₆) or a similar planar ring with c`
  * cat[0].clue[4] (value 500) — 644 chars · sample: `Isomers are compounds that share the same molecular formula but differ in struct`
  * cat[1].clue[0] (value 100) — 613 chars · sample: `An alcohol is an organic compound containing a hydroxyl (-OH) group bonded to a `
  * cat[1].clue[1] (value 200) — 609 chars · sample: `An organic acid (carboxylic acid) contains the carboxyl group (-COOH), which is `
  * cat[1].clue[2] (value 300) — 625 chars · sample: `An ester is an organic compound with the functional group -COO- (acid carbonyl +`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 667 chars

### `games/chemistry-regents/10 - Nuclear Chemistry Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 648 chars · sample: `An alpha particle (⁴₂He or α) consists of 2 protons + 2 neutrons—identical to a `
  * cat[0].clue[1] (value 200) — 613 chars · sample: `A beta particle (β⁻ or ⁰₋₁e) is a high-speed electron emitted from the nucleus w`
  * cat[0].clue[2] (value 300) — 658 chars · sample: `A gamma ray (γ) is a high-energy electromagnetic photon emitted from an excited `
  * cat[0].clue[3] (value 400) — 590 chars · sample: `A positron (β⁺ or ⁰₊₁e) is the antiparticle of the electron: same mass (1/1836 a`
  * cat[0].clue[4] (value 500) — 663 chars · sample: `Neutron emission releases a free neutron (¹₀n) from an unstable nucleus, decreas`
  * cat[1].clue[0] (value 100) — 628 chars · sample: `A radioisotope (or radionuclide) is an unstable isotope of an element that spont`
  * cat[1].clue[1] (value 200) — 650 chars · sample: `The band (or belt) of stability is the region on a plot of neutrons (N) vs. prot`
  * cat[1].clue[2] (value 300) — 667 chars · sample: `Transmutation is the conversion of one element into another by changing the numb`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 633 chars

### `games/chemistry-regents/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 593 chars · sample: `Counting subatomic particles is a foundational Regents skill. Number of protons `
  * cat[0].clue[1] (value 200) — 599 chars · sample: `Isotope calculation uses the weighted-average formula: atomic mass = Σ(isotope m`
  * cat[0].clue[2] (value 300) — 643 chars · sample: `Electron configuration shows how electrons are arranged in shells from the inner`
  * cat[0].clue[3] (value 400) — 668 chars · sample: `A periodic trend describes how an atomic property changes across a row or down a`
  * cat[0].clue[4] (value 500) — 631 chars · sample: `Ion formation occurs when an atom gains or loses electrons to achieve a stable (`
  * cat[1].clue[0] (value 100) — 603 chars · sample: `Bond polarity depends on the electronegativity difference (ΔEN) between bonded a`
  * cat[1].clue[1] (value 200) — 664 chars · sample: `Molecular shape (geometry) is determined by VSEPR theory (Valence Shell Electron`
  * cat[1].clue[2] (value 300) — 636 chars · sample: `Intermolecular forces (IMFs) are attractions between molecules, weaker than the `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 618 chars

### `games/civics-pig/05 - Public Policy and Civic Action Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 539 chars · sample: `Public policy is any government decision—law, regulation, executive order, court`
  * cat[0].clue[1] (value 200) — 603 chars · sample: `Cost-benefit analysis (CBA) is a systematic method of evaluating a policy by qua`
  * cat[0].clue[2] (value 300) — 542 chars · sample: `The 1st Amendment's Petition Clause gives every person the right to ask governme`
  * cat[0].clue[3] (value 400) — 539 chars · sample: `Public comment is a formal opportunity created by administrative law—primarily t`
  * cat[0].clue[4] (value 500) — 584 chars · sample: `Policy implementation is the phase of the policy cycle in which a law or executi`
  * cat[1].clue[0] (value 100) — 518 chars · sample: `Cities, towns, villages, counties, and school districts—is the tier of governmen`
  * cat[1].clue[1] (value 200) — 533 chars · sample: `A government budget is the formal plan for anticipated revenues (taxes, fees, fe`
  * cat[1].clue[2] (value 300) — 537 chars · sample: `Public goods are goods that are non-excludable (you cannot prevent someone from `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 603 chars

### `games/civics-pig/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 543 chars · sample: `The legislative branch—Congress, established by Article I—is the federal governm`
  * cat[0].clue[1] (value 200) — 531 chars · sample: `The rule of law is the foundational democratic principle that law—not the arbitr`
  * cat[0].clue[2] (value 300) — 554 chars · sample: `Due process—guaranteed by the 5th Amendment against federal action and the 14th `
  * cat[0].clue[3] (value 400) — 522 chars · sample: `A constituent is a citizen who lives within an elected official's geographic dis`
  * cat[0].clue[4] (value 500) — 548 chars · sample: `The 1st Amendment's religion clauses—Free Exercise and Establishment—protect rel`
  * cat[1].clue[0] (value 100) — 523 chars · sample: `A republic is a system of government in which supreme power rests with the citiz`
  * cat[1].clue[1] (value 200) — 561 chars · sample: `The U.S. Constitution (ratified 1788, effective 1789) is the supreme law of the `
  * cat[1].clue[2] (value 300) — 583 chars · sample: `The Bill of Rights—Amendments 1-10, ratified December 15, 1791—was added to the `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 612 chars

### `games/global-10-units/01 - World in 1750 Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 583 chars · sample: `At its height c.1750, the Ottoman Empire stretched from Anatolia and the Balkans`
  * cat[0].clue[1] (value 200) — 587 chars · sample: `The Mughal Empire ruled most of the Indian subcontinent from 1526; by 1750 it wa`
  * cat[0].clue[2] (value 300) — 599 chars · sample: `The Qing Dynasty (1644–1912), founded by Manchu conquerors who overthrew the Min`
  * cat[0].clue[3] (value 400) — 582 chars · sample: `Akbar the Great (r. 1556–1605) expanded Mughal territory to cover most of northe`
  * cat[0].clue[4] (value 500) — 670 chars · sample: `The Janissaries were elite Ottoman infantry troops recruited through the devshir`
  * cat[1].clue[0] (value 100) — 584 chars · sample: `Absolutism is the political system in which a monarch holds supreme, unchecked a`
  * cat[1].clue[1] (value 200) — 570 chars · sample: `The doctrine of divine right held that monarchs received their authority directl`
  * cat[1].clue[2] (value 300) — 614 chars · sample: `Louis XIV (r. 1643–1715) is the archetype of European absolutism: he moved the F`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 715 chars

### `games/global-10-units/02 - Enlightenment and Atlantic Revolutions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 662 chars · sample: `John Locke (1632–1704) argued in his Two Treatises of Government (1689) that all`
  * cat[0].clue[1] (value 200) — 632 chars · sample: `Montesquieu (1689–1755) published The Spirit of the Laws in 1748, arguing that g`
  * cat[0].clue[2] (value 300) — 655 chars · sample: `Voltaire (1694–1778) used wit and satire—especially in Candide (1759) and his Le`
  * cat[0].clue[3] (value 400) — 687 chars · sample: `Jean-Jacques Rousseau (1712–1778) argued in The Social Contract (1762) that sove`
  * cat[0].clue[4] (value 500) — 682 chars · sample: `Mary Wollstonecraft (1759–1797) published A Vindication of the Rights of Woman i`
  * cat[1].clue[0] (value 100) — 777 chars · sample: `The Scientific Revolution (roughly 1543–1700) replaced medieval reliance on chur`
  * cat[1].clue[1] (value 200) — 666 chars · sample: `Salons were regular social gatherings hosted primarily by educated women (salonn`
  * cat[1].clue[2] (value 300) — 664 chars · sample: `The Encyclopédie, edited by Denis Diderot and Jean le Rond d'Alembert and publis`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 792 chars

### `games/global-10-units/03 - Industrial Revolution Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 721 chars · sample: `The cottage industry (or putting-out system) was the pre-factory mode of textile`
  * cat[0].clue[1] (value 200) — 779 chars · sample: `Textile manufacturing was the leading industry of the first Industrial Revolutio`
  * cat[0].clue[2] (value 300) — 701 chars · sample: `James Watt (1736–1819) dramatically improved the Newcomen steam engine in 1769 b`
  * cat[0].clue[3] (value 400) — 750 chars · sample: `Britain's extensive, accessible coalfields—in South Wales, Yorkshire, and the Mi`
  * cat[0].clue[4] (value 500) — 691 chars · sample: `The substitution of coke (a coal derivative) for charcoal in iron smelting, pion`
  * cat[1].clue[0] (value 100) — 768 chars · sample: `Factory workers in early industrial Britain (c.1760–1850) endured 12–16 hour day`
  * cat[1].clue[1] (value 200) — 711 chars · sample: `Labor unions emerged in industrializing Britain in the early 1800s as workers or`
  * cat[1].clue[2] (value 300) — 741 chars · sample: `The Enclosure Movement in Britain (accelerating through a series of Parliamentar`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 778 chars

### `games/global-10-units/04 - Imperialism Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 741 chars · sample: `Imperialism is the policy by which a stronger nation extends political, economic`
  * cat[0].clue[1] (value 200) — 707 chars · sample: `Social Darwinism misapplied Charles Darwin's evolutionary theory of natural sele`
  * cat[0].clue[2] (value 300) — 718 chars · sample: `Industrial nations needed cheap, abundant raw materials their home territories c`
  * cat[0].clue[3] (value 400) — 735 chars · sample: `Nationalist rivalry among European powers was a major driver of New Imperialism:`
  * cat[0].clue[4] (value 500) — 742 chars · sample: `The Congo Free State (1885–1908) was the personal colony of Belgian King Leopold`
  * cat[1].clue[0] (value 100) — 809 chars · sample: `The British Raj (1858–1947) was the period of direct British Crown rule over Ind`
  * cat[1].clue[1] (value 200) — 718 chars · sample: `The Zulu Kingdom under King Cetshwayo defeated a British force of 1,300 at the B`
  * cat[1].clue[2] (value 300) — 711 chars · sample: `Indirect rule was Britain's preferred colonial system—developed theoretically by`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 855 chars

### `games/global-10-units/05 - Global Conflict World War I to World War II Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 804 chars · sample: `Archduke Franz Ferdinand, heir to the Austro-Hungarian throne, was assassinated `
  * cat[0].clue[1] (value 200) — 735 chars · sample: `The MAIN acronym—Militarism, Alliances, Imperialism, Nationalism—is the Regents-`
  * cat[0].clue[2] (value 300) — 754 chars · sample: `Militarism—the glorification of military power and the policy of maintaining lar`
  * cat[0].clue[3] (value 400) — 787 chars · sample: `By 1914 Europe was divided into two armed alliance blocs: the Triple Alliance (G`
  * cat[0].clue[4] (value 500) — 765 chars · sample: `Imperial competition—for colonies in Africa (the 1905 and 1911 Moroccan Crises) `
  * cat[1].clue[0] (value 100) — 794 chars · sample: `Trench warfare dominated the Western Front from September 1914 through the Armis`
  * cat[1].clue[1] (value 200) — 736 chars · sample: `The Treaty of Versailles, signed June 28, 1919, ended WWI by forcing Germany to `
  * cat[1].clue[2] (value 300) — 738 chars · sample: `The Russian Revolution of 1917 unfolded in two stages: the February Revolution (`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 919 chars

### `games/global-10-units/07 - Decolonization and Nationalism Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 609 chars · sample: `Mohandas K. Gandhi (1869–1948) led India's independence movement against British`
  * cat[0].clue[1] (value 200) — 578 chars · sample: `Jawaharlal Nehru (1889–1964) was India's first prime minister (1947–1964) and a `
  * cat[0].clue[2] (value 300) — 587 chars · sample: `Muhammad Ali Jinnah (1876–1948) led the All-India Muslim League and argued that `
  * cat[0].clue[3] (value 400) — 599 chars · sample: `Ho Chi Minh (1890–1969) founded the Indochinese Communist Party in 1930 and led `
  * cat[0].clue[4] (value 500) — 591 chars · sample: `Kwame Nkrumah (1909–1972) led Ghana — formerly the Gold Coast — to independence `
  * cat[1].clue[0] (value 100) — 602 chars · sample: `The Partition of India on August 14–15, 1947 divided British India into two inde`
  * cat[1].clue[1] (value 200) — 575 chars · sample: `The All-India Muslim League, founded in 1906, was the political organization tha`
  * cat[1].clue[2] (value 300) — 634 chars · sample: `The Indian National Congress (INC), founded in 1885, was the primary political o`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 644 chars

### `games/global-10-units/08 - Modernization Tensions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 658 chars · sample: `Mustafa Kemal Ataturk (1881–1938) founded the Republic of Turkey on October 29, `
  * cat[0].clue[1] (value 200) — 659 chars · sample: `Kemalism is the founding ideology of the Turkish Republic, comprising six princi`
  * cat[0].clue[2] (value 300) — 643 chars · sample: `Secularism in the political sense means the separation of religious institutions`
  * cat[0].clue[3] (value 400) — 664 chars · sample: `Westernization refers to the adoption of political institutions, cultural practi`
  * cat[0].clue[4] (value 500) — 639 chars · sample: `Modernization broadly refers to the transformation of societies through industri`
  * cat[1].clue[0] (value 100) — 719 chars · sample: `The Iranian Revolution (January–February 1979) overthrew Shah Mohammad Reza Pahl`
  * cat[1].clue[1] (value 200) — 646 chars · sample: `Ayatollah Ruhollah Khomeini (1902–1989) was a Shia Muslim cleric who developed t`
  * cat[1].clue[2] (value 300) — 663 chars · sample: `Shah Mohammad Reza Pahlavi ruled Iran from 1941 to 1979, returning to power afte`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 744 chars

### `games/global-10-units/09 - Globalization Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 626 chars · sample: `NAFTA (North American Free Trade Agreement), signed January 1, 1994 by the Unite`
  * cat[0].clue[1] (value 200) — 676 chars · sample: `The World Trade Organization (WTO), established January 1, 1995 as successor to `
  * cat[0].clue[2] (value 300) — 780 chars · sample: `The European Union (EU) evolved from the 1957 Treaty of Rome creating the Europe`
  * cat[0].clue[3] (value 400) — 690 chars · sample: `Free trade is an economic policy in which goods and services cross borders with `
  * cat[0].clue[4] (value 500) — 691 chars · sample: `Tariffs are taxes imposed by a government on imported goods, making foreign prod`
  * cat[1].clue[0] (value 100) — 693 chars · sample: `Globalization is the accelerating process of economic, political, cultural, and `
  * cat[1].clue[1] (value 200) — 681 chars · sample: `The internet, developed from the U.S. military's ARPANET (1969) and opened to co`
  * cat[1].clue[2] (value 300) — 640 chars · sample: `Social media platforms — including Facebook (2004), Twitter (2006), YouTube (200`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 755 chars

### `games/global-10-units/10 - Human Rights Violations Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 719 chars · sample: `Genocide is the intentional, systematic destruction — through killing, causing s`
  * cat[0].clue[1] (value 200) — 749 chars · sample: `The Universal Declaration of Human Rights (UDHR), adopted by the UN General Asse`
  * cat[0].clue[2] (value 300) — 699 chars · sample: `The Convention on the Prevention and Punishment of the Crime of Genocide, adopte`
  * cat[0].clue[3] (value 400) — 761 chars · sample: `The International Criminal Court (ICC), established by the Rome Statute (adopted`
  * cat[0].clue[4] (value 500) — 727 chars · sample: `Crimes against humanity are widespread or systematic attacks directed against an`
  * cat[1].clue[0] (value 100) — 787 chars · sample: `The Holocaust was the Nazi regime's systematic, state-sponsored persecution and `
  * cat[1].clue[1] (value 200) — 712 chars · sample: `The Nuremberg Trials (1945–1946) were a series of 13 military tribunals held in `
  * cat[1].clue[2] (value 300) — 742 chars · sample: `War crimes are serious violations of the laws and customs of war — including the`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 787 chars

### `games/global-9/05 - Postclassical Powers Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 610 chars · sample: `The Byzantine Empire was the eastern half of the Roman Empire that survived Rome`
  * cat[0].clue[1] (value 200) — 589 chars · sample: `Constantinople — founded by Emperor Constantine in 330 CE on a peninsula between`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `Charlemagne (742–814 CE), King of the Franks and Holy Roman Emperor (crowned 800`
  * cat[0].clue[3] (value 400) — 627 chars · sample: `Emperor Justinian I (r. 527–565 CE) commissioned a comprehensive codification of`
  * cat[0].clue[4] (value 500) — 633 chars · sample: `Eastern Orthodox Christianity developed in the Byzantine Empire, differing from `
  * cat[1].clue[0] (value 100) — 574 chars · sample: `Feudalism was the political and economic system that dominated medieval Western `
  * cat[1].clue[1] (value 200) — 551 chars · sample: `Manorialism was the economic system of medieval Europe in which the manor — a se`
  * cat[1].clue[2] (value 300) — 578 chars · sample: `The astrolabe was an ancient Greek astronomical instrument perfected by Islamic `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 662 chars

### `games/global-regents-sprint/Day 1 - Geography Turning Points Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 512 chars · sample: `Latitude lines run east-west and measure degrees north or south of the Equator (`
  * cat[0].clue[1] (value 200) — 594 chars · sample: `River valleys—fertile lowlands built up by sediment deposits from seasonal flood`
  * cat[0].clue[2] (value 300) — 537 chars · sample: `The Eurasian Steppe is a vast belt of treeless grassland stretching roughly 8,00`
  * cat[0].clue[3] (value 400) — 705 chars · sample: `Modernization is the process of adopting industrial, technological, legal, and p`
  * cat[0].clue[4] (value 500) — 610 chars · sample: `Anti-modernization is the deliberate rejection of Western-style industrializatio`
  * cat[1].clue[0] (value 100) — 561 chars · sample: `Nicolaus Copernicus published his heliocentric model in 1543, arguing that Earth`
  * cat[1].clue[1] (value 200) — 603 chars · sample: `Topography describes the physical shape of the land—mountains, valleys, plains, `
  * cat[1].clue[2] (value 300) — 529 chars · sample: `Longitude lines run north-south through the poles and measure degrees east or we`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 583 chars

### `games/global-regents-sprint/Day 2 - Economic Political Systems Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 635 chars · sample: `The encomienda was a Spanish colonial institution granting conquistadors the rig`
  * cat[0].clue[1] (value 200) — 716 chars · sample: `Feudalism was the dominant political and economic system in medieval Europe (rou`
  * cat[0].clue[2] (value 300) — 588 chars · sample: `Mercantilism, dominant in European thought from roughly 1500 to 1800, held that `
  * cat[0].clue[3] (value 400) — 626 chars · sample: `The means of production—factories, land, tools, machinery, and capital—are the r`
  * cat[0].clue[4] (value 500) — 662 chars · sample: `Central planning is an economic system in which the government—rather than marke`
  * cat[1].clue[0] (value 100) — 663 chars · sample: `Published in 1848 by Karl Marx and Friedrich Engels, The Communist Manifesto arg`
  * cat[1].clue[1] (value 200) — 685 chars · sample: `Laissez-faire capitalism, associated with Adam Smith's 1776 Wealth of Nations, a`
  * cat[1].clue[2] (value 300) — 615 chars · sample: `Capitalism is an economic system based on private ownership of property and the `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 712 chars

### `games/global-regents-sprint/Day 3 - Conflicts Human Rights Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 711 chars · sample: `MAIN is the standard acronym for the four underlying causes of World War I: Mili`
  * cat[0].clue[1] (value 200) — 612 chars · sample: `The 1919 Treaty of Versailles ended World War I by forcing Germany to accept sol`
  * cat[0].clue[2] (value 300) — 601 chars · sample: `Total war is a conflict in which a nation mobilizes its entire economy, populati`
  * cat[0].clue[3] (value 400) — 624 chars · sample: `Appeasement was the British and French policy of making concessions to Hitler's `
  * cat[0].clue[4] (value 500) — 725 chars · sample: `The Nuclear Age began on August 6, 1945, when the United States dropped the firs`
  * cat[1].clue[0] (value 100) — 686 chars · sample: `Containment was the foundational U.S. Cold War strategy, articulated by diplomat`
  * cat[1].clue[1] (value 200) — 679 chars · sample: `Winston Churchill coined 'Iron Curtain' in his 1946 Fulton, Missouri speech, des`
  * cat[1].clue[2] (value 300) — 709 chars · sample: `A proxy war is a conflict in which two major powers (typically the U.S. and USSR`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 844 chars

### `games/global-regents-sprint/Day 4 - Current Issues Names 1-42 Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 660 chars · sample: `Globalization is the accelerating interconnection of national economies, culture`
  * cat[0].clue[1] (value 200) — 673 chars · sample: `Deforestation—the large-scale clearing of forests for agriculture, ranching, log`
  * cat[0].clue[2] (value 300) — 672 chars · sample: `A pandemic is the worldwide spread of a new infectious disease to which populati`
  * cat[0].clue[3] (value 400) — 724 chars · sample: `Nuclear proliferation refers to the spread of nuclear weapons technology and mat`
  * cat[0].clue[4] (value 500) — 629 chars · sample: `Kashmir, a mountainous territory claimed by both India and Pakistan since 1947 p`
  * cat[1].clue[0] (value 100) — 746 chars · sample: `The Paris Agreement (December 2015), signed by 196 nations at COP21, commits par`
  * cat[1].clue[1] (value 200) — 616 chars · sample: `NAFTA (North American Free Trade Agreement, 1994–2020) eliminated most tariffs b`
  * cat[1].clue[2] (value 300) — 692 chars · sample: `The Nuclear Non-Proliferation Treaty (1968) has three pillars: nuclear-armed sta`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 689 chars

### `games/global-regents-sprint/Day 5 - People Power Reform Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 715 chars · sample: `Adolf Hitler (1889–1945) rose to power as Germany's Chancellor in 1933 and becam`
  * cat[0].clue[1] (value 200) — 765 chars · sample: `Benito Mussolini (1883–1945) founded fascism in Italy after WWI, leading his Bla`
  * cat[0].clue[2] (value 300) — 769 chars · sample: `Pol Pot (1925–1998), leader of the Khmer Rouge ('Red Khmer') movement, seized co`
  * cat[0].clue[3] (value 400) — 784 chars · sample: `Saddam Hussein ruled Iraq as a Ba'athist dictator from 1979 to 2003, using chemi`
  * cat[0].clue[4] (value 500) — 775 chars · sample: `Slobodan Milosevic (1941–2006), President of Serbia and later of the Federal Rep`
  * cat[1].clue[0] (value 100) — 765 chars · sample: `Vladimir Lenin (1870–1924) led Russia's Bolshevik Party to seize power in the Oc`
  * cat[1].clue[1] (value 200) — 798 chars · sample: `Egyptian President Anwar Sadat launched the Yom Kippur War (1973) to regain the `
  * cat[1].clue[2] (value 300) — 811 chars · sample: `F.W. de Klerk became South Africa's President in 1989 and made the extraordinary`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 795 chars

### `games/grade-12-ela/01 - Reading Literature - Plot Setting Character Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 673 chars · sample: `The inciting incident is the precipitating event that disrupts equilibrium and l`
  * cat[0].clue[1] (value 200) — 658 chars · sample: `Complications are rising-action events that escalate the central conflict betwee`
  * cat[0].clue[2] (value 300) — 631 chars · sample: `The climax is the play's structural and emotional peak, the highest point of act`
  * cat[0].clue[3] (value 400) — 653 chars · sample: `Falling action follows the climax, propelling events toward resolution while the`
  * cat[0].clue[4] (value 500) — 652 chars · sample: `Resolution (also called denouement, from the French 'untying') restores order an`
  * cat[1].clue[0] (value 100) — 697 chars · sample: `George Orwell's Nineteen Eighty-Four, published June 1949, projects Britain into`
  * cat[1].clue[1] (value 200) — 671 chars · sample: `Joseph Conrad's Heart of Darkness (serialized 1899, book 1902) follows Charles M`
  * cat[1].clue[2] (value 300) — 669 chars · sample: `Beowulf (composed orally c. 700-1000 CE; sole manuscript, the Nowell Codex, copi`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1020 chars

### `games/grade-12-ela/03 - Reading Informational - Main Idea Argument Evidence Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 735 chars · sample: `The central idea is the single most important point an informational text develo`
  * cat[0].clue[1] (value 200) — 712 chars · sample: `A claim is an arguable assertion the author wishes the audience to accept - the `
  * cat[0].clue[2] (value 300) — 715 chars · sample: `Supporting details are the specific facts, examples, statistics, quotations, ane`
  * cat[0].clue[3] (value 400) — 724 chars · sample: `A primary source is an eyewitness account or original document from the time of `
  * cat[0].clue[4] (value 500) — 749 chars · sample: `Appeal to false authority (also called argumentum ad verecundiam) cites an exper`
  * cat[1].clue[0] (value 100) — 726 chars · sample: `A counterclaim is the opposing view the writer must fairly acknowledge in argume`
  * cat[1].clue[1] (value 200) — 701 chars · sample: `A claim of value asserts that something is good or bad, just or unjust, beautifu`
  * cat[1].clue[2] (value 300) — 717 chars · sample: `An argument is strong only if its evidence is sufficient in quantity AND relevan`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1061 chars

### `games/grade-12-ela/05 - Writing - Argument Essay Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 747 chars · sample: `A thesis is an arguable, specific, defensible statement of the writer's position`
  * cat[0].clue[1] (value 200) — 766 chars · sample: `A thesis must be arguable - capable of being supported AND of being contested - `
  * cat[0].clue[2] (value 300) — 762 chars · sample: `A concessive thesis acknowledges the opposing view's strength before stating the`
  * cat[0].clue[3] (value 400) — 742 chars · sample: `A thesis that establishes the speaker's expertise alongside the claim - through `
  * cat[0].clue[4] (value 500) — 722 chars · sample: `A weak thesis that just restates the prompt or asserts an obvious fact has a lac`
  * cat[1].clue[0] (value 100) — 782 chars · sample: `Counterargument structure addresses 'they say' before 'I say' in argumentative w`
  * cat[1].clue[1] (value 200) — 760 chars · sample: `Concession is the brief rhetorical move of granting the opposing view's validity`
  * cat[1].clue[2] (value 300) — 771 chars · sample: `Straw man is the fallacy of misrepresenting an opponent's argument to make it ea`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1169 chars

### `games/grade-12-ela/07 - Language - Grammar Vocabulary Figurative Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 739 chars · sample: `A comma splice is the specific punctuation error of joining two complete indepen`
  * cat[0].clue[1] (value 200) — 702 chars · sample: `FANBOYS is the standard mnemonic for the seven coordinating conjunctions that ca`
  * cat[0].clue[2] (value 300) — 744 chars · sample: `A nonrestrictive (also nonessential or parenthetical) clause provides additional`
  * cat[0].clue[3] (value 400) — 760 chars · sample: `An introductory adverbial phrase (or clause) beginning a sentence requires a com`
  * cat[0].clue[4] (value 500) — 671 chars · sample: `The Oxford comma (also called serial comma or Harvard comma) is the comma placed`
  * cat[1].clue[0] (value 100) — 724 chars · sample: `A dangling modifier is a phrase whose intended subject is missing from the sente`
  * cat[1].clue[1] (value 200) — 685 chars · sample: `A misplaced modifier is a phrase placed too far from the word it actually modifi`
  * cat[1].clue[2] (value 300) — 717 chars · sample: `An adverb is the part of speech that modifies verbs, adjectives, or other adverb`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1195 chars

### `games/grade-6-science/01 - Cells and Living Systems Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 623 chars · sample: `Robert Hooke (1635-1703) published Micrographia in 1665 and coined the term 'cel`
  * cat[0].clue[1] (value 200) — 607 chars · sample: `Anton van Leeuwenhoek (1632-1723), a Delft draper with no formal scientific trai`
  * cat[0].clue[2] (value 300) — 565 chars · sample: `Matthias Schleiden (botanist) in 1838 and Theodor Schwann (zoologist) in 1839 ge`
  * cat[0].clue[3] (value 400) — 593 chars · sample: `Rudolf Virchow (1821-1902), a Berlin pathologist, declared in 1855 that 'Omnis c`
  * cat[0].clue[4] (value 500) — 554 chars · sample: `Cell theory, finalized by 1858, has three tenets: (1) all living things are made`
  * cat[1].clue[0] (value 100) — 578 chars · sample: `The nucleus is the membrane-bound control center of eukaryotic cells, first desc`
  * cat[1].clue[1] (value 200) — 605 chars · sample: `Mitochondria (singular: mitochondrion) are bean-shaped organelles where cellular`
  * cat[1].clue[2] (value 300) — 581 chars · sample: `The cell wall is a rigid outer layer outside the cell membrane in plant cells (m`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 629 chars

### `games/grade-6-science/02 - Body Systems and Homeostasis Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 590 chars · sample: `The mouth begins digestion through two processes simultaneously: mechanical (tee`
  * cat[0].clue[1] (value 200) — 611 chars · sample: `The esophagus is a 25-centimeter muscular tube connecting the pharynx to the sto`
  * cat[0].clue[2] (value 300) — 543 chars · sample: `The stomach holds about 1.5 liters and secretes hydrochloric acid (HCl, pH ~1.5-`
  * cat[0].clue[3] (value 400) — 577 chars · sample: `The small intestine is roughly 6 meters long with three parts (duodenum, jejunum`
  * cat[0].clue[4] (value 500) — 580 chars · sample: `The liver is the largest internal organ (about 1.5 kg in adults) and performs ov`
  * cat[1].clue[0] (value 100) — 573 chars · sample: `The human heart is a fist-sized four-chambered muscular pump that beats about 10`
  * cat[1].clue[1] (value 200) — 556 chars · sample: `Arteries are blood vessels carrying blood AWAY from the heart, almost always oxy`
  * cat[1].clue[2] (value 300) — 603 chars · sample: `Capillaries are the smallest blood vessels, about 5-10 micrometers across—just w`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 688 chars

### `games/grade-6-science/03 - Energy and Matter Cycles Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 568 chars · sample: `Photosynthesis is the biochemical process by which plants, algae, and cyanobacte`
  * cat[0].clue[1] (value 200) — 588 chars · sample: `Chlorophyll is the green pigment in chloroplast thylakoid membranes that absorbs`
  * cat[0].clue[2] (value 300) — 522 chars · sample: `Photosynthesis inputs are CO2 from the air (entering through stomata on leaves),`
  * cat[0].clue[3] (value 400) — 541 chars · sample: `Glucose (C6H12O6) is the six-carbon sugar produced when CO2 is fixed in the Calv`
  * cat[0].clue[4] (value 500) — 600 chars · sample: `Jan Ingenhousz (1730-1799), a Dutch-British physician, published Experiments upo`
  * cat[1].clue[0] (value 100) — 517 chars · sample: `Cellular respiration breaks glucose into CO2 and water, capturing energy as ATP:`
  * cat[1].clue[1] (value 200) — 530 chars · sample: `Aerobic cellular respiration produces CO2 (exhaled), water (added to body fluids`
  * cat[1].clue[2] (value 300) — 517 chars · sample: `ATP (adenosine triphosphate) is the universal energy currency: cells release ene`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 611 chars

### `games/grade-6-science/04 - Weather and Climate Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 560 chars · sample: `The troposphere is the lowest atmospheric layer, extending from the surface to a`
  * cat[0].clue[1] (value 200) — 537 chars · sample: `The stratosphere extends from about 10-12 km to 50 km altitude. Temperature INCR`
  * cat[0].clue[2] (value 300) — 554 chars · sample: `The mesosphere extends from 50 km to 85 km altitude and is where most meteors bu`
  * cat[0].clue[3] (value 400) — 547 chars · sample: `The thermosphere extends from 85 km to about 600 km. Temperatures can reach 2,00`
  * cat[0].clue[4] (value 500) — 553 chars · sample: `The exosphere extends from about 600 km to 10,000 km, gradually thinning until p`
  * cat[1].clue[0] (value 100) — 542 chars · sample: `Evaporation is the phase change from liquid water to water vapor when molecules `
  * cat[1].clue[1] (value 200) — 549 chars · sample: `Condensation is the phase change from gas to liquid: rising water vapor cools at`
  * cat[1].clue[2] (value 300) — 556 chars · sample: `Runoff is the surface flow of liquid water across land into streams, rivers, lak`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 627 chars

### `games/grade-6-science/05 - Earth's Place in Space Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 538 chars · sample: `The Sun is a G-type main-sequence star about 1.39 million km in diameter (109 Ea`
  * cat[0].clue[1] (value 200) — 576 chars · sample: `Eight planets orbit the Sun: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranu`
  * cat[0].clue[2] (value 300) — 543 chars · sample: `Jupiter, the largest planet at 142,984 km diameter (11.2 Earths) and 318 Earth m`
  * cat[0].clue[3] (value 400) — 553 chars · sample: `Nicolaus Copernicus (1473-1543), a Polish canon and astronomer, published De Rev`
  * cat[0].clue[4] (value 500) — 560 chars · sample: `Johannes Kepler (1571-1630), German astronomer to Emperor Rudolf II, used Tycho `
  * cat[1].clue[0] (value 100) — 545 chars · sample: `Earth rotates once on its axis every 23 hours, 56 minutes, 4 seconds (a sidereal`
  * cat[1].clue[1] (value 200) — 513 chars · sample: `Earth orbits the Sun in 365.256 days—the sidereal year—at an average distance of`
  * cat[1].clue[2] (value 300) — 558 chars · sample: `Earth's rotational axis is tilted 23.5 degrees from the perpendicular to its orb`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 680 chars

### `games/grade-6-science/06 - Engineering Design Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 541 chars · sample: `Defining the problem is the first step in any engineering design process: state `
  * cat[0].clue[1] (value 200) — 524 chars · sample: `Criteria are the specific requirements a successful solution must meet—what it m`
  * cat[0].clue[2] (value 300) — 513 chars · sample: `Constraints are the limits within which a solution must work—boundaries on mater`
  * cat[0].clue[3] (value 400) — 543 chars · sample: `End users are the people the design ultimately serves—children, athletes, doctor`
  * cat[0].clue[4] (value 500) — 533 chars · sample: `Global challenges are large-scale societal problems—plastic pollution, climate c`
  * cat[1].clue[0] (value 100) — 576 chars · sample: `Brainstorming, named by ad executive Alex Osborn in his 1953 book Applied Imagin`
  * cat[1].clue[1] (value 200) — 523 chars · sample: `A sketch is a quick freehand drawing capturing a design idea fast enough to keep`
  * cat[1].clue[2] (value 300) — 546 chars · sample: `Evaluation is the design step where teams compare brainstormed solutions against`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 629 chars

### `games/grade-6-science/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 511 chars · sample: `The cell is the smallest unit considered alive—the basic unit of structure and f`
  * cat[0].clue[1] (value 200) — 526 chars · sample: `Cell theory has three tenets: (1) all living things are made of cells (Schleiden`
  * cat[0].clue[2] (value 300) — 530 chars · sample: `Mitochondria are bean-shaped organelles in eukaryotic cells where cellular respi`
  * cat[0].clue[3] (value 400) — 511 chars · sample: `The 10% rule, formalized by ecologist Raymond Lindeman in his landmark 1942 pape`
  * cat[0].clue[4] (value 500) — 522 chars · sample: `Condensation is the phase change of water vapor back to liquid as rising air coo`
  * cat[1].clue[0] (value 100) — 508 chars · sample: `Photosynthesis is the central energy-input reaction for nearly all life: 6 CO2 +`
  * cat[1].clue[1] (value 200) — 533 chars · sample: `Cellular respiration runs photosynthesis in reverse: C6H12O6 + 6 O2 -> 6 CO2 + 6`
  * cat[1].clue[2] (value 300) — 524 chars · sample: `Carl Linnaeus, a Swedish botanist, published Systema Naturae in 1735 introducing`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 675 chars

### `games/grade-7-ela/01 - Reading Literature: Story Elements Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 601 chars · sample: `Plot is the structured chain of events that drives a narrative, traditionally di`
  * cat[0].clue[1] (value 200) — 570 chars · sample: `The climax is the highest-tension moment when the protagonist confronts the cent`
  * cat[0].clue[2] (value 300) — 606 chars · sample: `Exposition delivers the foundational who, where, and when of a story, typically `
  * cat[0].clue[3] (value 400) — 589 chars · sample: `Falling action consists of the consequences that follow the climax and steer the`
  * cat[0].clue[4] (value 500) — 618 chars · sample: `The resolution is the story's conclusion, where conflicts settle and the lasting`
  * cat[1].clue[0] (value 100) — 614 chars · sample: `The protagonist is the central character whose decisions and growth drive the na`
  * cat[1].clue[1] (value 200) — 588 chars · sample: `The antagonist creates the central conflict the protagonist must struggle agains`
  * cat[1].clue[2] (value 300) — 579 chars · sample: `A dynamic character undergoes meaningful internal change in beliefs, values, or `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 719 chars

### `games/grade-7-ela/04 - Reading Informational: Author's Purpose, Argument Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 569 chars · sample: `Author's purpose is the reason a writer creates a text—typically remembered thro`
  * cat[0].clue[1] (value 200) — 583 chars · sample: `Persuasive writing tries to convince readers to adopt a belief or take an action`
  * cat[0].clue[2] (value 300) — 600 chars · sample: `Informative writing aims to convey factual information and explain ideas clearly`
  * cat[0].clue[3] (value 400) — 586 chars · sample: `Narrative writing tells a story—real or imagined—with characters, setting, confl`
  * cat[0].clue[4] (value 500) — 611 chars · sample: `Supporting details are the specific facts, examples, statistics, quotations, or `
  * cat[1].clue[0] (value 100) — 550 chars · sample: `A claim is the central position or belief an author argues for and supports thro`
  * cat[1].clue[1] (value 200) — 576 chars · sample: `Reasoning is the logical thinking an author uses to connect evidence to a claim—`
  * cat[1].clue[2] (value 300) — 594 chars · sample: `Evidence is the specific facts, examples, statistics, expert quotations, or rese`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 689 chars

### `games/grade-7-ela/06 - Language + Vocabulary Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 557 chars · sample: `A noun names a person (Ponyboy), place (Tulsa), thing (book), or idea (courage).`
  * cat[0].clue[1] (value 200) — 556 chars · sample: `A verb expresses action ('Ponyboy runs') or state of being ('Auggie is brave'); `
  * cat[0].clue[2] (value 300) — 561 chars · sample: `An adjective is a word that describes or modifies a noun, answering questions li`
  * cat[0].clue[3] (value 400) — 563 chars · sample: `An adverb modifies a verb, adjective, or another adverb, often answering how, wh`
  * cat[0].clue[4] (value 500) — 588 chars · sample: `A preposition is a word that links a noun (the object of the preposition) to oth`
  * cat[1].clue[0] (value 100) — 598 chars · sample: `A declarative sentence makes a statement and ends with a period: 'Ponyboy lives `
  * cat[1].clue[1] (value 200) — 594 chars · sample: `An interrogative sentence asks a question and ends with a question mark: 'Why do`
  * cat[1].clue[2] (value 300) — 591 chars · sample: `An imperative sentence gives a command, request, or instruction and often ends w`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 833 chars

### `games/grade-7-math/01 - Proportional Relationships and Percents Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 610 chars · sample: `A ratio compares two quantities by division, written as a:b, a to b, or a/b. NYS`
  * cat[0].clue[1] (value 200) — 616 chars · sample: `A rate is a ratio comparing two quantities measured in different units—miles per`
  * cat[0].clue[2] (value 300) — 593 chars · sample: `A unit rate has a denominator of 1, expressing the per-one-unit value: 40 mph me`
  * cat[0].clue[3] (value 400) — 586 chars · sample: `A proportion is an equation stating two ratios are equal: a/b = c/d. NYS Grade 7`
  * cat[0].clue[4] (value 500) — 616 chars · sample: `The constant of proportionality k is the fixed ratio y/x between two proportiona`
  * cat[1].clue[0] (value 100) — 599 chars · sample: `A proportional relationship has y = kx for some constant k (constant of proporti`
  * cat[1].clue[1] (value 200) — 641 chars · sample: `The graph of a proportional relationship is a straight line passing through the `
  * cat[1].clue[2] (value 300) — 574 chars · sample: `A ratio table shows pairs of values for proportional quantities, with the ratio `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 731 chars

### `games/grade-7-math/03 - Expressions and Two-Step Equations Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 674 chars · sample: `A variable is a letter or symbol representing an unknown number (typically x, y,`
  * cat[0].clue[1] (value 200) — 644 chars · sample: `A coefficient is the numerical factor multiplied by a variable; in 3x, the coeff`
  * cat[0].clue[2] (value 300) — 641 chars · sample: `Like terms have the same variable raised to the same power; their coefficients c`
  * cat[0].clue[3] (value 400) — 602 chars · sample: `To expand 3(x + 2), apply the distributive property: 3 × x + 3 × 2 = 3x + 6. NYS`
  * cat[0].clue[4] (value 500) — 634 chars · sample: `To factor an expression, identify the greatest common factor (GCF) of all terms `
  * cat[1].clue[0] (value 100) — 596 chars · sample: `A two-step equation requires two inverse operations to isolate the variable—typi`
  * cat[1].clue[1] (value 200) — 529 chars · sample: `To solve x + 7 = 12, perform the inverse of +7 (which is −7) on BOTH sides: x = `
  * cat[1].clue[2] (value 300) — 599 chars · sample: `To solve 4x = 20, divide both sides by 4 (inverse of ×4): x = 20/4 = 5. Check: 4`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 803 chars

### `games/grade-7-math/05 - Statistics: Sampling and Inference Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 687 chars · sample: `The population is the entire group of individuals or items being studied. NYS Gr`
  * cat[0].clue[1] (value 200) — 679 chars · sample: `A sample is a subset of the population, used to make inferences about the entire`
  * cat[0].clue[2] (value 300) — 705 chars · sample: `A random sample is one in which every member of the population has an equal prob`
  * cat[0].clue[3] (value 400) — 734 chars · sample: `A biased sample over-represents or under-represents subgroups of the population,`
  * cat[0].clue[4] (value 500) — 725 chars · sample: `A sample statistic is a numerical summary of a sample—mean, median, mode, propor`
  * cat[1].clue[0] (value 100) — 708 chars · sample: `Systematic sampling selects every kth member from a list after a random starting`
  * cat[1].clue[1] (value 200) — 758 chars · sample: `Stratified sampling divides the population into mutually exclusive groups (strat`
  * cat[1].clue[2] (value 300) — 697 chars · sample: `Convenience sampling selects whomever is easiest to reach—classmates, neighbors,`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 880 chars

### `games/grade-7-math/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 586 chars · sample: `The constant of proportionality k = y/x in a proportional relationship y = kx is`
  * cat[0].clue[1] (value 200) — 542 chars · sample: `To convert percent to decimal, divide by 100 or move decimal two places left: 30`
  * cat[0].clue[2] (value 300) — 543 chars · sample: `Tax = (tax rate as decimal) × price = 0.08 × 40 = $3.20. NYS Grade 7 Math standa`
  * cat[0].clue[3] (value 400) — 575 chars · sample: `Discount = (discount rate) × original price = 0.20 × 60 = $12. NYS Grade 7 Math `
  * cat[0].clue[4] (value 500) — 563 chars · sample: `Percent change = (new − old)/old × 100 = (60 − 50)/50 × 100 = 10/50 × 100 = 20%.`
  * cat[1].clue[0] (value 100) — 624 chars · sample: `To add integers with different signs: subtract absolute values, keep sign of lar`
  * cat[1].clue[1] (value 200) — 635 chars · sample: `To add fractions: find common denominator, convert, add numerators, simplify. NY`
  * cat[1].clue[2] (value 300) — 530 chars · sample: `For multiplying integers: different signs give negative product. NYS Grade 7 Mat`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 927 chars

### `games/grade-7-science/01 - Reproduction and Heredity Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 611 chars · sample: `Sexual reproduction requires two parents, each contributing a gamete (egg or spe`
  * cat[0].clue[1] (value 200) — 622 chars · sample: `Asexual reproduction involves one parent and produces genetically identical offs`
  * cat[0].clue[2] (value 300) — 577 chars · sample: `A gamete is a haploid sex cell—egg (ovum) or sperm—carrying half (n) the chromos`
  * cat[0].clue[3] (value 400) — 584 chars · sample: `Binary fission is the asexual reproduction used by prokaryotes (bacteria and arc`
  * cat[0].clue[4] (value 500) — 648 chars · sample: `Genetic variation—differences in DNA among individuals—is the key advantage of s`
  * cat[1].clue[0] (value 100) — 578 chars · sample: `An inherited trait is a feature—eye color, blood type, leaf shape—passed from pa`
  * cat[1].clue[1] (value 200) — 620 chars · sample: `Gregor Mendel (1822-1884), an Augustinian friar at St. Thomas's Abbey in Brünn, `
  * cat[1].clue[2] (value 300) — 583 chars · sample: `Alleles are different versions of the same gene that occupy the same locus on ho`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 671 chars

### `games/grade-7-science/02 - Ecosystems Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 632 chars · sample: `Biodiversity is the variety of life at three levels—genetic, species, and ecosys`
  * cat[0].clue[1] (value 200) — 644 chars · sample: `A population is a group of individuals of the same species occupying a defined a`
  * cat[0].clue[2] (value 300) — 641 chars · sample: `A community is the assemblage of all interacting populations of different specie`
  * cat[0].clue[3] (value 400) — 661 chars · sample: `A keystone species is one whose impact on its community far exceeds its abundanc`
  * cat[0].clue[4] (value 500) — 658 chars · sample: `Endemism measures species native to and found ONLY in one geographic region. Con`
  * cat[1].clue[0] (value 100) — 586 chars · sample: `A producer or autotroph is an organism that synthesizes its own food from inorga`
  * cat[1].clue[1] (value 200) — 681 chars · sample: `An herbivore is a consumer that feeds exclusively on plants (producers); the ter`
  * cat[1].clue[2] (value 300) — 643 chars · sample: `A food chain is a linear sequence showing energy transfer from producers through`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 764 chars

### `games/grade-7-science/03 - Earth's History Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 624 chars · sample: `Igneous rocks form from the cooling and solidification of magma (underground) or`
  * cat[0].clue[1] (value 200) — 633 chars · sample: `Sedimentary rocks form from compacted and cemented sediments—weathered fragments`
  * cat[0].clue[2] (value 300) — 660 chars · sample: `Metamorphic rocks form when existing rocks (igneous, sedimentary, or other metam`
  * cat[0].clue[3] (value 400) — 642 chars · sample: `Weathering is the in-situ breakdown of rocks at or near Earth's surface by physi`
  * cat[0].clue[4] (value 500) — 650 chars · sample: `Erosion is the transport of weathered material from one place to another by agen`
  * cat[1].clue[0] (value 100) — 673 chars · sample: `A fossil is the preserved remains, imprint, or trace of an ancient organism, gen`
  * cat[1].clue[1] (value 200) — 632 chars · sample: `A paleontologist studies fossils to reconstruct ancient life, evolution, and Ear`
  * cat[1].clue[2] (value 300) — 610 chars · sample: `Radiocarbon (carbon-14) dating measures the decay of C-14 in organic remains to `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 897 chars

### `games/grade-7-science/04 - Earth's Resources Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 686 chars · sample: `A mineral is a naturally occurring, inorganic, crystalline solid with a specific`
  * cat[0].clue[1] (value 200) — 635 chars · sample: `The Mohs Hardness Scale ranks minerals 1-10 by scratch resistance. German geolog`
  * cat[0].clue[2] (value 300) — 671 chars · sample: `An ore is a naturally occurring rock or mineral deposit containing enough of a v`
  * cat[0].clue[3] (value 400) — 648 chars · sample: `A streak test identifies minerals by the color of their powder when rubbed on an`
  * cat[0].clue[4] (value 500) — 655 chars · sample: `Cleavage is the tendency of a mineral to break along smooth, flat planes determi`
  * cat[1].clue[0] (value 100) — 686 chars · sample: `Coal is a sedimentary fossil fuel formed from ancient plant matter compressed an`
  * cat[1].clue[1] (value 200) — 656 chars · sample: `Petroleum is a liquid mixture of hydrocarbons formed from marine plankton and al`
  * cat[1].clue[2] (value 300) — 651 chars · sample: `Natural gas is a fossil fuel composed mostly of methane (CH4, 70-90%) with ethan`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 938 chars

### `games/grade-7-science/05 - Chemical Reactions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 690 chars · sample: `An atom is the smallest unit of an element that retains the element's chemical p`
  * cat[0].clue[1] (value 200) — 627 chars · sample: `A proton is a positively charged subatomic particle in the nucleus, with mass ~1`
  * cat[0].clue[2] (value 300) — 655 chars · sample: `A neutron is a neutral subatomic particle in the nucleus with mass slightly grea`
  * cat[0].clue[3] (value 400) — 678 chars · sample: `An electron is a negatively charged subatomic particle that occupies regions aro`
  * cat[0].clue[4] (value 500) — 655 chars · sample: `The atomic nucleus is the dense central region containing protons and neutrons (`
  * cat[1].clue[0] (value 100) — 707 chars · sample: `Dmitri Mendeleev (1834-1907), a Russian chemist at St. Petersburg University, pu`
  * cat[1].clue[1] (value 200) — 676 chars · sample: `An element is a pure substance consisting of only one type of atom (one atomic n`
  * cat[1].clue[2] (value 300) — 653 chars · sample: `A group is a vertical column of the periodic table containing elements with the `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 951 chars

### `games/grade-7-science/06 - Forces and Interactions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 760 chars · sample: `Sir Isaac Newton (1642-1727) published Philosophiae Naturalis Principia Mathemat`
  * cat[0].clue[1] (value 200) — 683 chars · sample: `Newton's First Law (Law of Inertia) states that an object at rest stays at rest `
  * cat[0].clue[2] (value 300) — 571 chars · sample: `Newton's Second Law states F = ma: net force on an object equals mass times acce`
  * cat[0].clue[3] (value 400) — 686 chars · sample: `Newton's Third Law states that for every action, there is an equal and opposite `
  * cat[0].clue[4] (value 500) — 741 chars · sample: `Friction is the force that resists relative motion between surfaces in contact. `
  * cat[1].clue[0] (value 100) — 657 chars · sample: `Gravity is the attractive force between any two objects with mass; it shapes the`
  * cat[1].clue[1] (value 200) — 661 chars · sample: `The acceleration due to gravity at Earth's surface is approximately 9.8 m/s^2 (m`
  * cat[1].clue[2] (value 300) — 621 chars · sample: `Weight is the gravitational force exerted on an object by a planet: W = mg, wher`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1048 chars

### `games/grade-7-science/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 690 chars · sample: `Crossing over (chiasma formation) occurs in prophase I of meiosis when homologou`
  * cat[0].clue[1] (value 200) — 648 chars · sample: `Decomposers—primarily bacteria and fungi—break down dead organic matter, releasi`
  * cat[0].clue[2] (value 300) — 626 chars · sample: `Gregor Mendel (1822-1884) was an Augustinian friar at St. Thomas's Abbey in Brün`
  * cat[0].clue[3] (value 400) — 643 chars · sample: `The 10% rule states that only ~10% of energy at one trophic level is transferred`
  * cat[0].clue[4] (value 500) — 590 chars · sample: `Human gametes (egg or sperm) contain 23 chromosomes—the haploid number (n)—becau`
  * cat[1].clue[0] (value 100) — 687 chars · sample: `Plate tectonics is the unifying theory stating that Earth's lithosphere is broke`
  * cat[1].clue[1] (value 200) — 665 chars · sample: `Climate change is long-term changes in Earth's temperature and weather patterns,`
  * cat[1].clue[2] (value 300) — 670 chars · sample: `The Law of Superposition states that in undisturbed sedimentary rock sequences, `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1026 chars

### `games/grade-7/05 - The Constitution in Practice Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 547 chars · sample: `Enumerated (or expressed) powers are the specific authorities the Constitution e`
  * cat[0].clue[1] (value 200) — 573 chars · sample: `Reserved powers are the vast range of governing authorities that the Constitutio`
  * cat[0].clue[2] (value 300) — 517 chars · sample: `Concurrent powers are governmental authorities exercised by both the federal gov`
  * cat[0].clue[3] (value 400) — 509 chars · sample: `The Supremacy Clause (Article VI) declares that the Constitution, federal laws, `
  * cat[0].clue[4] (value 500) — 553 chars · sample: `The Elastic Clause (Article I, Section 8) states that Congress may make all laws`
  * cat[1].clue[0] (value 100) — 599 chars · sample: `Congress is the federal legislative branch established in Article I of the Const`
  * cat[1].clue[1] (value 200) — 584 chars · sample: `The President of the United States is the head of the executive branch and, unde`
  * cat[1].clue[2] (value 300) — 609 chars · sample: `The Supreme Court, established by Article III of the Constitution, is the final `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 644 chars

### `games/grade-7/07 - Reform Movements Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 562 chars · sample: `The Second Great Awakening was a wave of Protestant religious revivalism that sw`
  * cat[0].clue[1] (value 200) — 554 chars · sample: `A reform movement is an organized, sustained effort to change a specific social `
  * cat[0].clue[2] (value 300) — 567 chars · sample: `The temperance movement called on Americans to reduce or completely give up alco`
  * cat[0].clue[3] (value 400) — 607 chars · sample: `Before the public education reform movement, schooling in America was uneven, ex`
  * cat[0].clue[4] (value 500) — 590 chars · sample: `Dorothea Dix (1802–1887) was a Massachusetts schoolteacher who began investigati`
  * cat[1].clue[0] (value 100) — 658 chars · sample: `Abolitionism was the movement demanding the total and immediate end of slavery, `
  * cat[1].clue[1] (value 200) — 674 chars · sample: `Frederick Douglass (1818–1895) was born enslaved in Maryland, taught himself to `
  * cat[1].clue[2] (value 300) — 636 chars · sample: `William Lloyd Garrison (1805–1879) was the era's most uncompromising white aboli`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 643 chars

### `games/grade-7/08 - A Nation Divided Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 572 chars · sample: `Industrialization — the shift from handcraft to factory production — transformed`
  * cat[0].clue[1] (value 200) — 598 chars · sample: `The Kansas-Nebraska Act (1854), engineered by Senator Stephen Douglas, organized`
  * cat[0].clue[2] (value 300) — 599 chars · sample: `An agrarian economy is one built around farming rather than manufacturing or tra`
  * cat[0].clue[3] (value 400) — 593 chars · sample: `Bleeding Kansas (1854–1858) was the violent conflict that erupted in Kansas Terr`
  * cat[0].clue[4] (value 500) — 597 chars · sample: `The abolitionist press wielded enormous influence in shaping Northern opinion ag`
  * cat[1].clue[0] (value 100) — 595 chars · sample: `The Republican Party was founded in 1854 as a direct response to the Kansas-Nebr`
  * cat[1].clue[1] (value 200) — 649 chars · sample: `The Dred Scott decision (1857) was one of the most consequential and damaging Su`
  * cat[1].clue[2] (value 300) — 646 chars · sample: `States' rights is the doctrine that the Constitution granted limited powers to t`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 702 chars

### `games/grade-8-ela/01 - Reading Literature: Story Elements Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 585 chars · sample: `Plot is the structured sequence of events in a narrative, traditionally diagramm`
  * cat[0].clue[1] (value 200) — 579 chars · sample: `The climax is the highest-tension moment when the protagonist faces the central `
  * cat[0].clue[2] (value 300) — 546 chars · sample: `Exposition delivers the foundational who, where, and when of a story—often in th`
  * cat[0].clue[3] (value 400) — 549 chars · sample: `Falling action consists of the consequences and adjustments that follow the clim`
  * cat[0].clue[4] (value 500) — 554 chars · sample: `Resolution is the conclusion in which conflicts are settled and the story's last`
  * cat[1].clue[0] (value 100) — 554 chars · sample: `The protagonist is the central character whose actions and decisions drive the p`
  * cat[1].clue[1] (value 200) — 584 chars · sample: `The antagonist creates the central conflict that the protagonist must struggle a`
  * cat[1].clue[2] (value 300) — 557 chars · sample: `A dynamic character undergoes meaningful internal change—shifts in belief, value`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 678 chars

### `games/grade-8-ela/02 - Reading Literature: Theme and Craft Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 547 chars · sample: `Theme is a universal insight about life, humanity, or society conveyed through t`
  * cat[0].clue[1] (value 200) — 545 chars · sample: `Topic is the broad subject of a text—stated in one or two words like 'friendship`
  * cat[0].clue[2] (value 300) — 561 chars · sample: `A motif is a recurring image, idea, or symbolic element that develops theme acro`
  * cat[0].clue[3] (value 400) — 553 chars · sample: `A moral is an explicit lesson stated or strongly implied at the end of a fable, `
  * cat[0].clue[4] (value 500) — 596 chars · sample: `Theme development is how an author advances a central idea through accumulating `
  * cat[1].clue[0] (value 100) — 542 chars · sample: `A metaphor asserts that one thing is another, creating a direct figurative equat`
  * cat[1].clue[1] (value 200) — 539 chars · sample: `A simile uses 'like' or 'as' to make an explicit comparison between two unlike t`
  * cat[1].clue[2] (value 300) — 569 chars · sample: `Personification attributes human emotions, thoughts, or actions to non-human ent`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 633 chars

### `games/grade-8-ela/03 - Reading Informational: Main Idea Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 543 chars · sample: `The main idea is the central point an informational text makes about its topic—w`
  * cat[0].clue[1] (value 200) — 581 chars · sample: `Topic is the general subject of an informational text—a word or short phrase lik`
  * cat[0].clue[2] (value 300) — 568 chars · sample: `Supporting details are specific facts, statistics, examples, quotations, or anec`
  * cat[0].clue[3] (value 400) — 549 chars · sample: `A summary briefly restates a text's main idea and key supporting details in the `
  * cat[0].clue[4] (value 500) — 547 chars · sample: `Implicit information must be inferred from textual evidence rather than read dir`
  * cat[1].clue[0] (value 100) — 527 chars · sample: `A topic sentence states the main idea of a paragraph, typically at the beginning`
  * cat[1].clue[1] (value 200) — 538 chars · sample: `A concluding sentence restates the paragraph's main idea, often by summarizing k`
  * cat[1].clue[2] (value 300) — 550 chars · sample: `Previewing is the pre-reading strategy of scanning a text's title, headings, sub`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 671 chars

### `games/grade-8-ela/04 - Reading Informational: Author's Purpose Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 586 chars · sample: `Author's purpose is the reason the author wrote a text—commonly summarized as PI`
  * cat[0].clue[1] (value 200) — 621 chars · sample: `Audience is the specific group of readers the author writes for—signaled by voca`
  * cat[0].clue[2] (value 300) — 578 chars · sample: `Persuasive purpose is the author's aim to convince readers of a position, change`
  * cat[0].clue[3] (value 400) — 621 chars · sample: `Informative purpose aims to provide factual information, explain concepts, or de`
  * cat[0].clue[4] (value 500) — 595 chars · sample: `Entertaining purpose aims to amuse, engage, or evoke emotional response—evident `
  * cat[1].clue[0] (value 100) — 581 chars · sample: `Logos is the rhetorical appeal to logic and reason—using facts, statistics, expe`
  * cat[1].clue[1] (value 200) — 597 chars · sample: `Pathos is the rhetorical appeal to emotion—engaging readers' feelings of fear, a`
  * cat[1].clue[2] (value 300) — 638 chars · sample: `Ethos is the rhetorical appeal to the speaker's or writer's credibility, charact`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 661 chars

### `games/grade-8-ela/07 - Language and Vocabulary Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 631 chars · sample: `A noun is a word that names a person (Anne Frank), place (Amsterdam), thing (dia`
  * cat[0].clue[1] (value 200) — 586 chars · sample: `A verb expresses action ('write,' 'run,' 'think') or state of being ('is,' 'beco`
  * cat[0].clue[2] (value 300) — 580 chars · sample: `An adjective modifies a noun by describing a quality, quantity, or characteristi`
  * cat[0].clue[3] (value 400) — 540 chars · sample: `An adverb modifies a verb, adjective, or another adverb—answering when ('soon'),`
  * cat[0].clue[4] (value 500) — 584 chars · sample: `A preposition links a noun or pronoun (its object) to other words in a sentence,`
  * cat[1].clue[0] (value 100) — 584 chars · sample: `A simple sentence contains one independent clause—a subject and a predicate expr`
  * cat[1].clue[1] (value 200) — 570 chars · sample: `A compound sentence joins two independent clauses with a coordinating conjunctio`
  * cat[1].clue[2] (value 300) — 550 chars · sample: `A complex sentence joins one independent clause with one or more dependent (subo`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 707 chars

### `games/grade-8-math/03 - Functions Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 743 chars · sample: `A function is a rule that assigns to each input exactly ONE output. NYS Common C`
  * cat[0].clue[1] (value 200) — 704 chars · sample: `The domain of a function is the set of all valid inputs (x-values). NYS Common C`
  * cat[0].clue[2] (value 300) — 707 chars · sample: `The range of a function is the set of all valid outputs (y-values). NYS Common C`
  * cat[0].clue[3] (value 400) — 731 chars · sample: `The vertical line test: a graph represents a function if and only if every VERTI`
  * cat[0].clue[4] (value 500) — 718 chars · sample: `A linear function has the form y = mx + b where m is the slope and b is the y-in`
  * cat[1].clue[0] (value 100) — 677 chars · sample: `Slope (m) measures a line's steepness: m = rise/run = (change in y)/(change in x`
  * cat[1].clue[1] (value 200) — 646 chars · sample: `To find slope between two points: m = (y2 - y1)/(x2 - x1). For (1, 2) and (3, 8)`
  * cat[1].clue[2] (value 300) — 610 chars · sample: `Slope between (2, 5) and (6, 1): m = (1 - 5)/(6 - 2) = -4/4 = -1. NYS Common Cor`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 780 chars

### `games/grade-8-math/06 - Statistics and Probability Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 779 chars · sample: `A SCATTER PLOT displays paired data (x, y) as points on a coordinate plane. NYS `
  * cat[0].clue[1] (value 200) — 792 chars · sample: `A scatter plot whose points tend to RISE from left to right shows POSITIVE assoc`
  * cat[0].clue[2] (value 300) — 726 chars · sample: `A scatter plot whose points tend to FALL from left to right shows NEGATIVE assoc`
  * cat[0].clue[3] (value 400) — 780 chars · sample: `A scatter plot with NO CLEAR upward or downward trend shows NO ASSOCIATION — x a`
  * cat[0].clue[4] (value 500) — 769 chars · sample: `An OUTLIER is a data point that lies FAR from the overall pattern of the scatter`
  * cat[1].clue[0] (value 100) — 712 chars · sample: `The LINE OF BEST FIT is a straight line drawn through a scatter plot to summariz`
  * cat[1].clue[1] (value 200) — 670 chars · sample: `To predict y using the line of best fit y = 2x + 5 at x = 10: substitute x = 10:`
  * cat[1].clue[2] (value 300) — 712 chars · sample: `In a line of best fit y = mx + b, the SLOPE m represents the RATE OF CHANGE: the`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 984 chars

### `games/grade-8-math/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 711 chars · sample: `sqrt(16) = 4 is RATIONAL because 16 is a perfect square. NYS Common Core Grade 8`
  * cat[0].clue[1] (value 200) — 745 chars · sample: `To convert 0.000045 to scientific notation: move the decimal point right until e`
  * cat[0].clue[2] (value 300) — 758 chars · sample: `Cube root of -64 = -4 because (-4)^3 = (-4)(-4)(-4) = 16 × -4 = -64. NYS Common `
  * cat[0].clue[3] (value 400) — 705 chars · sample: `Multiplying powers with the same base: ADD the exponents. 10^4 × 10^-7 = 10^(4 +`
  * cat[0].clue[4] (value 500) — 706 chars · sample: `sqrt(50) is irrational since 50 is not a perfect square. NYS Common Core Grade 8`
  * cat[1].clue[0] (value 100) — 668 chars · sample: `To solve 4x + 7 = 27: isolate x using inverse operations. NYS Common Core Grade `
  * cat[1].clue[1] (value 200) — 735 chars · sample: `2x + 5 = 2x + 11: subtract 2x from both sides → 5 = 11, a contradiction → NO sol`
  * cat[1].clue[2] (value 300) — 632 chars · sample: `To solve 3(x + 4) = 24: first DISTRIBUTE the 3 across the parentheses (NYS Commo`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 810 chars

### `games/grade-8-science/01 - Natural Selection and Evolution Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 710 chars · sample: `Charles Robert Darwin (1809-1882) developed the theory of evolution by natural s`
  * cat[0].clue[1] (value 200) — 754 chars · sample: `HMS Beagle was a Royal Navy survey ship that carried Charles Darwin around the w`
  * cat[0].clue[2] (value 300) — 789 chars · sample: `The Galapagos Islands are a volcanic archipelago ~1,000 km west of Ecuador in th`
  * cat[0].clue[3] (value 400) — 750 chars · sample: `Alfred Russel Wallace (1823-1913), a British naturalist working in the Malay Arc`
  * cat[0].clue[4] (value 500) — 732 chars · sample: `On the Origin of Species, by Means of Natural Selection, or the Preservation of `
  * cat[1].clue[0] (value 100) — 788 chars · sample: `Natural selection is the differential reproduction of organisms based on heritab`
  * cat[1].clue[1] (value 200) — 728 chars · sample: `An adaptation is a heritable trait that increases an organism's fitness in its e`
  * cat[1].clue[2] (value 300) — 721 chars · sample: `Evolutionary fitness measures an organism's relative reproductive success—the nu`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1057 chars

### `games/grade-8-science/02 - Growth and Reproduction Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 660 chars · sample: `Meiosis is a two-stage cell division producing four haploid gametes from one dip`
  * cat[0].clue[1] (value 200) — 667 chars · sample: `A gamete is a haploid sex cell—egg (ovum) or sperm—carrying half the chromosome `
  * cat[0].clue[2] (value 300) — 683 chars · sample: `Crossing over (chiasma formation) occurs in prophase I of meiosis when homologou`
  * cat[0].clue[3] (value 400) — 698 chars · sample: `Meiosis produces four haploid daughter cells from one diploid parent, through tw`
  * cat[0].clue[4] (value 500) — 663 chars · sample: `Prophase I is the first and longest phase of meiosis I, lasting hours to weeks (`
  * cat[1].clue[0] (value 100) — 713 chars · sample: `Genetic variation is the differences in DNA sequence among individuals of a popu`
  * cat[1].clue[1] (value 200) — 668 chars · sample: `Independent assortment is the random orientation of homologous chromosome pairs `
  * cat[1].clue[2] (value 300) — 660 chars · sample: `Fertilization is the fusion of two haploid gametes (egg + sperm) to form a diplo`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1090 chars

### `games/grade-8-science/03 - Waves and Information Transfer Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 692 chars · sample: `A wave is a disturbance that propagates energy through a medium or space, withou`
  * cat[0].clue[1] (value 200) — 684 chars · sample: `Wavelength (Greek letter lambda) is the distance between two successive identica`
  * cat[0].clue[2] (value 300) — 615 chars · sample: `Frequency is the number of complete wave cycles passing a fixed point per second`
  * cat[0].clue[3] (value 400) — 638 chars · sample: `Amplitude is the maximum displacement of a wave from its rest (equilibrium) posi`
  * cat[0].clue[4] (value 500) — 639 chars · sample: `The wave equation v = f * lambda (or speed = frequency x wavelength) relates wav`
  * cat[1].clue[0] (value 100) — 655 chars · sample: `Sound waves are mechanical longitudinal waves (compressions and rarefactions of `
  * cat[1].clue[1] (value 200) — 660 chars · sample: `The speed of sound in air at 20 degrees Celsius is approximately 343 m/s (~767 m`
  * cat[1].clue[2] (value 300) — 648 chars · sample: `The Doppler effect is the apparent change in wave frequency when a source and ob`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1140 chars

### `games/grade-8-science/04 - Electromagnetic Forces Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 701 chars · sample: `Electric charge comes in two types—positive (carried by protons) and negative (c`
  * cat[0].clue[1] (value 200) — 739 chars · sample: `Static electricity is the accumulation of electric charge on the surface of obje`
  * cat[0].clue[2] (value 300) — 731 chars · sample: `Electric current is the flow of electric charge through a conductor, measured in`
  * cat[0].clue[3] (value 400) — 645 chars · sample: `An insulator is a material with very few free electrons, resisting electrical cu`
  * cat[0].clue[4] (value 500) — 677 chars · sample: `Copper is the second-most conductive metal (after silver) and the standard mater`
  * cat[1].clue[0] (value 100) — 703 chars · sample: `An electric circuit is a closed loop through which electric current flows, consi`
  * cat[1].clue[1] (value 200) — 638 chars · sample: `A series circuit has all components connected in a single path; current is the s`
  * cat[1].clue[2] (value 300) — 620 chars · sample: `A parallel circuit has components on separate branches with multiple current pat`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1273 chars

### `games/grade-8-science/05 - Energy Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 657 chars · sample: `Kinetic energy is the energy of motion: KE = (1/2)*m*v^2. Gottfried Leibniz firs`
  * cat[0].clue[1] (value 200) — 623 chars · sample: `Potential energy is stored energy due to an object's position, configuration, or`
  * cat[0].clue[2] (value 300) — 603 chars · sample: `Gravitational potential energy is calculated as PE = m * g * h, where m is mass `
  * cat[0].clue[3] (value 400) — 678 chars · sample: `Elastic potential energy is stored in stretched or compressed elastic materials `
  * cat[0].clue[4] (value 500) — 691 chars · sample: `Mechanical energy is the total of an object's kinetic and potential energy: ME =`
  * cat[1].clue[0] (value 100) — 753 chars · sample: `The Law of Conservation of Energy states that energy cannot be created or destro`
  * cat[1].clue[1] (value 200) — 730 chars · sample: `James Prescott Joule (1818-1889), an English physicist working in his family bre`
  * cat[1].clue[2] (value 300) — 640 chars · sample: `A battery converts chemical potential energy into electrical energy through redo`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1034 chars

### `games/grade-8-science/06 - Human Impact and Engineering Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 663 chars · sample: `Climate change is the long-term shift in Earth's temperature and weather pattern`
  * cat[0].clue[1] (value 200) — 672 chars · sample: `Carbon dioxide (CO2) is the primary greenhouse gas released by burning fossil fu`
  * cat[0].clue[2] (value 300) — 709 chars · sample: `The greenhouse effect is the warming of a planet's surface caused by atmospheric`
  * cat[0].clue[3] (value 400) — 699 chars · sample: `The Keeling Curve is the longest continuous record of atmospheric CO2 concentrat`
  * cat[0].clue[4] (value 500) — 702 chars · sample: `Earth's global average surface temperature has risen ~1.1 degrees Celsius (~2 de`
  * cat[1].clue[0] (value 100) — 734 chars · sample: `Pollution is the introduction of harmful substances into the environment, affect`
  * cat[1].clue[1] (value 200) — 682 chars · sample: `Eutrophication is the over-enrichment of waterways with nutrients (nitrogen, pho`
  * cat[1].clue[2] (value 300) — 681 chars · sample: `The Montreal Protocol on Substances that Deplete the Ozone Layer was signed Sept`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1251 chars

### `games/grade-8-science/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 768 chars · sample: `On the Origin of Species, by Means of Natural Selection, or the Preservation of `
  * cat[0].clue[1] (value 200) — 750 chars · sample: `Natural selection is the differential reproduction of organisms based on heritab`
  * cat[0].clue[2] (value 300) — 789 chars · sample: `The Galapagos Islands are a volcanic archipelago ~1,000 km west of Ecuador in th`
  * cat[0].clue[3] (value 400) — 713 chars · sample: `Archaeopteryx lithographica is a key transitional fossil discovered in 1861 in t`
  * cat[0].clue[4] (value 500) — 671 chars · sample: `The Modern Synthesis—also called the Neo-Darwinian synthesis—integrated Darwin's`
  * cat[1].clue[0] (value 100) — 633 chars · sample: `Gregor Mendel (1822-1884), an Augustinian friar at St. Thomas's Abbey in Brünn, `
  * cat[1].clue[1] (value 200) — 698 chars · sample: `DNA (deoxyribonucleic acid) is the double-helix molecule that stores hereditary `
  * cat[1].clue[2] (value 300) — 660 chars · sample: `Meiosis is a two-stage cell division producing four haploid gametes from one dip`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1351 chars

### `games/living-environment/02 - The Cell Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 669 chars · sample: `The cell membrane (plasma membrane) is the boundary that controls what enters an`
  * cat[0].clue[1] (value 200) — 671 chars · sample: `Each phospholipid has a polar (hydrophilic, water-loving) head and two nonpolar `
  * cat[0].clue[2] (value 300) — 664 chars · sample: `Selective permeability (semi-permeability) means the membrane allows some molecu`
  * cat[0].clue[3] (value 400) — 644 chars · sample: `Diffusion is passive transport: molecules move from where they are more concentr`
  * cat[0].clue[4] (value 500) — 662 chars · sample: `Osmosis is a special case of diffusion — water moving across a selectively perme`
  * cat[1].clue[0] (value 100) — 662 chars · sample: `The nucleus is the largest and most visible organelle in most eukaryotic cells. `
  * cat[1].clue[1] (value 200) — 641 chars · sample: `Ribosomes are the protein-building machines of the cell. They read mRNA three ba`
  * cat[1].clue[2] (value 300) — 687 chars · sample: `Mitochondria (plural) are double-membrane organelles where most of the cell's AT`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 727 chars

### `games/living-environment/03 - Genetics and Heredity Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 688 chars · sample: `DNA (deoxyribonucleic acid) is the molecule of heredity. James Watson and Franci`
  * cat[0].clue[1] (value 200) — 648 chars · sample: `A gene is a DNA segment whose base sequence specifies the amino acid sequence of`
  * cat[0].clue[2] (value 300) — 633 chars · sample: `A chromosome is a single, very long DNA molecule wound around histone proteins. `
  * cat[0].clue[3] (value 400) — 689 chars · sample: `A genome is the total genetic material of an organism. The human genome contains`
  * cat[0].clue[4] (value 500) — 623 chars · sample: `A nucleotide has three parts: a 5-carbon sugar (deoxyribose in DNA, ribose in RN`
  * cat[1].clue[0] (value 100) — 639 chars · sample: `An allele is one of the alternative forms of a gene. For a gene with two alleles`
  * cat[1].clue[1] (value 200) — 578 chars · sample: `A dominant allele determines the phenotype when at least one copy is present in `
  * cat[1].clue[2] (value 300) — 670 chars · sample: `A recessive allele only determines the phenotype when both copies are recessive `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 674 chars

### `games/living-environment/04 - Reproduction and Development Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 696 chars · sample: `Mitosis is nuclear division producing two daughter cells genetically identical t`
  * cat[0].clue[1] (value 200) — 674 chars · sample: `Meiosis is a special two-stage cell division that produces gametes — sperm and e`
  * cat[0].clue[2] (value 300) — 665 chars · sample: `After DNA replication during S-phase (before mitosis or meiosis), each chromosom`
  * cat[0].clue[3] (value 400) — 610 chars · sample: `Spindle fibers are bundles of microtubules — protein cables — that form during p`
  * cat[0].clue[4] (value 500) — 703 chars · sample: `Cytokinesis is the splitting of the cytoplasm following mitosis or meiosis to pr`
  * cat[1].clue[0] (value 100) — 657 chars · sample: `A gamete is a haploid sex cell — sperm or egg — produced by meiosis from a diplo`
  * cat[1].clue[1] (value 200) — 694 chars · sample: `Fertilization is the union of two haploid gametes (sperm + egg) to produce one d`
  * cat[1].clue[2] (value 300) — 600 chars · sample: `A zygote is the single diploid cell formed when a sperm fertilizes an egg. It co`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 769 chars

### `games/living-environment/05 - Evolution and Biodiversity Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 803 chars · sample: `Natural selection is the central mechanism of evolution proposed by Charles Darw`
  * cat[0].clue[1] (value 200) — 699 chars · sample: `In evolutionary biology, fitness is NOT about strength or speed — it is about ho`
  * cat[0].clue[2] (value 300) — 710 chars · sample: `Overproduction means species produce many more offspring than the environment ca`
  * cat[0].clue[3] (value 400) — 675 chars · sample: `Competition for limited resources — food, water, mates, light, space, nesting si`
  * cat[0].clue[4] (value 500) — 673 chars · sample: `Differential survival is the outcome of natural selection: individuals with favo`
  * cat[1].clue[0] (value 100) — 728 chars · sample: `The fossil record preserves the history of life as fossils in sedimentary rock l`
  * cat[1].clue[1] (value 200) — 705 chars · sample: `Comparative anatomy compares the body structures of different species. Homologou`
  * cat[1].clue[2] (value 300) — 707 chars · sample: `Molecular evidence — comparing DNA sequences, protein amino-acid sequences, or o`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 767 chars

### `games/living-environment/06 - Ecology Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 644 chars · sample: `Producers (autotrophs) build their own food from inorganic raw materials and an `
  * cat[0].clue[1] (value 200) — 681 chars · sample: `Consumers (heterotrophs) cannot make their own food and must consume other organ`
  * cat[0].clue[2] (value 300) — 687 chars · sample: `Decomposers break down dead organisms and organic waste, releasing nutrients bac`
  * cat[0].clue[3] (value 400) — 718 chars · sample: `An herbivore is an animal whose diet is exclusively or primarily plants. Herbivo`
  * cat[0].clue[4] (value 500) — 755 chars · sample: `A predator is an animal that hunts, kills, and consumes other animals (prey). Pr`
  * cat[1].clue[0] (value 100) — 633 chars · sample: `A food chain is a linear sequence showing the flow of energy and nutrients from `
  * cat[1].clue[1] (value 200) — 704 chars · sample: `A food web is a network of interconnected food chains in an ecosystem. Most anim`
  * cat[1].clue[2] (value 300) — 683 chars · sample: `An energy pyramid (also called a trophic pyramid) shows how energy is distribute`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 782 chars

### `games/living-environment/07 - Human Impact on the Environment Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 689 chars · sample: `Point-source pollution comes from a single identifiable origin — a factory smoke`
  * cat[0].clue[1] (value 200) — 701 chars · sample: `Nonpoint-source pollution comes from many diffuse sources scattered over a wide `
  * cat[0].clue[2] (value 300) — 672 chars · sample: `Acid rain forms when sulfur dioxide (SO2) and nitrogen oxides (NOx) emitted by c`
  * cat[0].clue[3] (value 400) — 670 chars · sample: `Particulate matter (PM) is tiny solid or liquid particles suspended in the air. `
  * cat[0].clue[4] (value 500) — 702 chars · sample: `Thermal pollution is the release of warm water (or sometimes very cold water) in`
  * cat[1].clue[0] (value 100) — 719 chars · sample: `A renewable resource is one that naturally replenishes within a human timescale `
  * cat[1].clue[1] (value 200) — 693 chars · sample: `Nonrenewable resources cannot be replenished within a human timescale. Fossil fu`
  * cat[1].clue[2] (value 300) — 729 chars · sample: `Sustainable yield is harvesting a renewable resource at or below its natural rep`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 750 chars

### `games/living-environment/08 - Homeostasis and Body Systems Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 703 chars · sample: `Negative feedback is the most common homeostatic mechanism. When a variable stra`
  * cat[0].clue[1] (value 200) — 687 chars · sample: `Positive feedback amplifies a change instead of reversing it — the response make`
  * cat[0].clue[2] (value 300) — 734 chars · sample: `A receptor is a cell or molecular structure that detects a specific stimulus and`
  * cat[0].clue[3] (value 400) — 668 chars · sample: `An effector is the muscle or gland that carries out the body's response in a fee`
  * cat[0].clue[4] (value 500) — 659 chars · sample: `A set point is the optimal target value of a homeostatic variable around which t`
  * cat[1].clue[0] (value 100) — 676 chars · sample: `The circulatory (cardiovascular) system has three main components: the heart (a `
  * cat[1].clue[1] (value 200) — 637 chars · sample: `Blood plasma is the straw-colored fluid that makes up about 55% of blood volume.`
  * cat[1].clue[2] (value 300) — 700 chars · sample: `Hemoglobin is a protein in red blood cells that binds oxygen in the lungs (where`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 778 chars

### `games/living-environment/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 673 chars · sample: `Cell specialization (differentiation) is the process by which initially unspecia`
  * cat[0].clue[1] (value 200) — 694 chars · sample: `Membrane transport encompasses all the ways substances cross the cell membrane: `
  * cat[0].clue[2] (value 300) — 712 chars · sample: `Enzyme action follows the lock-and-key (or induced-fit) model: a substrate molec`
  * cat[0].clue[3] (value 400) — 733 chars · sample: `Body systems interact constantly to maintain homeostasis and carry out the eight`
  * cat[0].clue[4] (value 500) — 721 chars · sample: `A homeostatic response is the body's coordinated reaction to a change that pulls`
  * cat[1].clue[0] (value 100) — 665 chars · sample: `DNA replication is the process by which a cell duplicates its entire DNA before `
  * cat[1].clue[1] (value 200) — 724 chars · sample: `Protein synthesis converts the DNA code into a functioning protein in two steps.`
  * cat[1].clue[2] (value 300) — 738 chars · sample: `Inheritance patterns describe how traits move from parents to offspring. Simple `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 835 chars

### `games/physics-regents/01 - Mechanics - Motion Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 859 chars · sample: `Displacement is defined as the vector from initial to final position: d = x_f - `
  * cat[0].clue[1] (value 200) — 748 chars · sample: `Distance is the cumulative length of the path an object follows, with no directi`
  * cat[0].clue[2] (value 300) — 734 chars · sample: `Velocity is defined as v = d/t where d is displacement (vector), giving SI units`
  * cat[0].clue[3] (value 400) — 788 chars · sample: `Speed is the magnitude of the velocity vector and equals distance divided by tim`
  * cat[0].clue[4] (value 500) — 793 chars · sample: `Acceleration is defined as a = (v_f - v_i)/t, the change in velocity divided by `
  * cat[1].clue[0] (value 100) — 839 chars · sample: `A position-time (x-t) graph plots an object's position on the vertical axis agai`
  * cat[1].clue[1] (value 200) — 850 chars · sample: `On a velocity-time (v-t) graph, the slope dv/dt at any point equals instantaneou`
  * cat[1].clue[2] (value 300) — 797 chars · sample: `Slope on a motion graph carries a specific physical meaning based on the axes: o`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 972 chars

### `games/physics-regents/02 - Mechanics - Forces Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 796 chars · sample: `Force is a vector interaction between objects that can change motion (accelerate`
  * cat[0].clue[1] (value 200) — 808 chars · sample: `The net force (F_net) is the vector sum of every individual force acting on an o`
  * cat[0].clue[2] (value 300) — 860 chars · sample: `Inertia is the tendency of an object to maintain its current velocity (whether a`
  * cat[0].clue[3] (value 400) — 813 chars · sample: `Mass is the scalar measure of how much matter an object contains and how much it`
  * cat[0].clue[4] (value 500) — 784 chars · sample: `Weight (W) is the gravitational force exerted by a large body (typically Earth) `
  * cat[1].clue[0] (value 100) — 886 chars · sample: `Newton's first law (the law of inertia, Principia 1687) states that an object at`
  * cat[1].clue[1] (value 200) — 772 chars · sample: `Newton's second law (Principia, 1687) quantitatively relates net force, mass, an`
  * cat[1].clue[2] (value 300) — 898 chars · sample: `Newton's third law (Principia, 1687) states that for every force one object exer`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 943 chars

### `games/physics-regents/03 - Energy Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 886 chars · sample: `Work (W) is the energy transferred to or from an object by a force acting throug`
  * cat[0].clue[1] (value 200) — 785 chars · sample: `Power (P) is the rate of doing work or transferring energy: P = W/t = F·v (for c`
  * cat[0].clue[2] (value 300) — 766 chars · sample: `The work-energy theorem states that the net work done on an object by all forces`
  * cat[0].clue[3] (value 400) — 860 chars · sample: `Machine efficiency (eta) is defined as the ratio of useful work output to total `
  * cat[0].clue[4] (value 500) — 943 chars · sample: `Mechanical advantage (MA) is the ratio of the output force a simple machine prod`
  * cat[1].clue[0] (value 100) — 833 chars · sample: `Kinetic energy (KE) is the energy an object possesses due to its motion: KE = (1`
  * cat[1].clue[1] (value 200) — 870 chars · sample: `Gravitational potential energy (PE_g or U_g) is the energy stored in an object d`
  * cat[1].clue[2] (value 300) — 841 chars · sample: `Elastic potential energy (PE_s) is the energy stored in an elastic spring (or ot`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 971 chars

### `games/physics-regents/05 - Circular Motion and Gravity Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 841 chars · sample: `Centripetal acceleration (a_c) is the acceleration of an object moving along a c`
  * cat[0].clue[1] (value 200) — 878 chars · sample: `Centripetal force (F_c) is the net force required to keep an object moving in a `
  * cat[0].clue[2] (value 300) — 731 chars · sample: `Period (T) is the time for one complete cycle or revolution. SI unit is the seco`
  * cat[0].clue[3] (value 400) — 854 chars · sample: `Frequency (f) is the number of complete cycles per unit time. SI unit is the her`
  * cat[0].clue[4] (value 500) — 920 chars · sample: `Tangential speed (v) is the linear speed of an object moving along a circular pa`
  * cat[1].clue[0] (value 100) — 895 chars · sample: `Gravitational force is the attractive force between any two masses, given by New`
  * cat[1].clue[1] (value 200) — 899 chars · sample: `A gravitational field is a region of space in which a mass experiences a gravita`
  * cat[1].clue[2] (value 300) — 920 chars · sample: `An inverse-square law states that a physical quantity is inversely proportional `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 936 chars

### `games/physics-regents/06 - Electric Fields Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 953 chars · sample: `Electric charge (q) is a fundamental property of matter that produces electric f`
  * cat[0].clue[1] (value 200) — 885 chars · sample: `Conservation of charge is a fundamental physical law: the total electric charge `
  * cat[0].clue[2] (value 300) — 918 chars · sample: `The elementary charge (e) is the magnitude of charge on a single proton (+e) or `
  * cat[0].clue[3] (value 400) — 990 chars · sample: `A conductor is a material in which electrons can move freely from atom to atom. `
  * cat[0].clue[4] (value 500) — 969 chars · sample: `An insulator is a material in which electrons are tightly bound to individual at`
  * cat[1].clue[0] (value 100) — 924 chars · sample: `Coulomb's law (Charles-Augustin de Coulomb, 1785) gives the electrostatic force `
  * cat[1].clue[1] (value 200) — 902 chars · sample: `Electric force (F_e) is the force between charged objects, given by Coulomb's la`
  * cat[1].clue[2] (value 300) — 920 chars · sample: `The inverse-square relationship in Coulomb's law (F_e ∝ 1/r^2) parallels Newton'`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 945 chars

### `games/physics-regents/07 - Circuits Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 978 chars · sample: `Electric current (I) is the rate at which electric charge flows past a given poi`
  * cat[0].clue[1] (value 200) — 898 chars · sample: `Resistance (R) is a conductor's opposition to electric current. From Ohm's law (`
  * cat[0].clue[2] (value 300) — 852 chars · sample: `Potential difference (V), or voltage, between two points in a circuit is the ene`
  * cat[0].clue[3] (value 400) — 925 chars · sample: `Power (P) is the rate at which electrical energy is transferred or converted: P `
  * cat[0].clue[4] (value 500) — 843 chars · sample: `Energy consumption is the total electrical energy used by a device: W = P·t. SI `
  * cat[1].clue[0] (value 100) — 894 chars · sample: `Ohm's law (Georg Ohm, 1827) states that for an ohmic resistor, the current flowi`
  * cat[1].clue[1] (value 200) — 788 chars · sample: `Equivalent resistance (R_eq) is the single resistance value that would behave id`
  * cat[1].clue[2] (value 300) — 917 chars · sample: `A voltmeter measures the potential difference (voltage) between two points in a `
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 974 chars

### `games/physics-regents/08 - Magnetism and Electromagnetic Induction Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 909 chars · sample: `A magnetic field (B) is the region of space around a magnet or current-carrying `
  * cat[0].clue[1] (value 200) — 984 chars · sample: `A magnetic domain is a small region within a ferromagnetic material (iron, nicke`
  * cat[0].clue[2] (value 300) — 921 chars · sample: `The north pole of a magnet is the end from which magnetic field lines emerge ext`
  * cat[0].clue[3] (value 400) — 1053 chars · sample: `The south pole of a magnet is the end at which magnetic field lines enter extern`
  * cat[0].clue[4] (value 500) — 1018 chars · sample: `Field-line patterns are visual representations of magnetic field structure. For `
  * cat[1].clue[0] (value 100) — 856 chars · sample: `Magnetic force on a moving charged particle is F = q·v·B·sin(theta), where q is `
  * cat[1].clue[1] (value 200) — 960 chars · sample: `The right-hand rule is a mnemonic for determining vector directions in electroma`
  * cat[1].clue[2] (value 300) — 915 chars · sample: `A charged particle moving in a magnetic field follows a curved path. When veloci`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 983 chars

### `games/physics-regents/09 - Waves and Sound Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 842 chars · sample: `Wavelength (lambda) is the spatial distance over which a wave repeats itself — t`
  * cat[0].clue[1] (value 200) — 930 chars · sample: `Frequency (f) is the number of complete wave cycles passing a fixed point per se`
  * cat[0].clue[2] (value 300) — 853 chars · sample: `Period (T) is the time required for one complete wave cycle to pass a given poin`
  * cat[0].clue[3] (value 400) — 958 chars · sample: `Amplitude (A) is the maximum displacement of a wave from its equilibrium (rest) `
  * cat[0].clue[4] (value 500) — 926 chars · sample: `Wave speed (v) is the rate at which a wave's pattern propagates through a medium`
  * cat[1].clue[0] (value 100) — 1044 chars · sample: `A transverse wave is one in which the oscillations of the medium are PERPENDICUL`
  * cat[1].clue[1] (value 200) — 1041 chars · sample: `A longitudinal wave is one in which the oscillations of the medium are PARALLEL `
  * cat[1].clue[2] (value 300) — 944 chars · sample: `A mechanical wave requires a material medium (solid, liquid, or gas) to propagat`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 949 chars

### `games/physics-regents/10 - Optics and Modern Physics Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 1045 chars · sample: `The ray model treats light as straight-line rays that propagate from a source, i`
  * cat[0].clue[1] (value 200) — 922 chars · sample: `The law of reflection states that when light (or any wave) reflects from a surfa`
  * cat[0].clue[2] (value 300) — 876 chars · sample: `Snell's law (Willebrord Snell, 1621) describes refraction at a boundary between `
  * cat[0].clue[3] (value 400) — 976 chars · sample: `Total internal reflection (TIR) occurs when light traveling in a higher-index me`
  * cat[0].clue[4] (value 500) — 1115 chars · sample: `Dispersion is the variation of the index of refraction with wavelength, causing `
  * cat[1].clue[0] (value 100) — 1000 chars · sample: `A concave mirror has a reflecting surface curved inward (like the inside of a sp`
  * cat[1].clue[1] (value 200) — 955 chars · sample: `A convex mirror has a reflecting surface curved outward (like the outside of a s`
  * cat[1].clue[2] (value 300) — 916 chars · sample: `A converging lens (also called a convex lens or positive lens) has surfaces curv`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1028 chars

### `games/physics-regents/99 - Cumulative Yearlong Jeopardy Review.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 951 chars · sample: `Slope on a kinematic graph carries a physical meaning that depends on the axes: `
  * cat[0].clue[1] (value 200) — 829 chars · sample: `Projectile motion is decomposed into independent horizontal and vertical compone`
  * cat[0].clue[2] (value 300) — 864 chars · sample: `Net-force calculation involves finding the vector sum of all forces acting on an`
  * cat[0].clue[3] (value 400) — 942 chars · sample: `Free-body diagram (FBD) construction requires careful choice of which forces to `
  * cat[0].clue[4] (value 500) — 1000 chars · sample: `The friction model on the NYS Reference Tables: kinetic friction f_k = mu_k·N (c`
  * cat[1].clue[0] (value 100) — 934 chars · sample: `The work-energy theorem connects work to kinetic energy change: W_net = ΔKE = (1`
  * cat[1].clue[1] (value 200) — 817 chars · sample: `Setting up conservation equations involves identifying two well-chosen states of`
  * cat[1].clue[2] (value 300) — 811 chars · sample: `Impulse equals the area under a force-time graph: J = integral of F·dt = area (N`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 1144 chars

### `games/us-regents-sprint/Day 2 - Amendments Documents Laws Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 530 chars · sample: `Ratified December 15, 1791, the Bill of Rights comprises the first ten amendment`
  * cat[0].clue[1] (value 200) — 515 chars · sample: `Ratified December 6, 1865, the 13th Amendment abolished slavery and involuntary `
  * cat[0].clue[2] (value 300) — 509 chars · sample: `Ratified July 9, 1868, the 14th Amendment overturned Dred Scott v. Sandford (185`
  * cat[0].clue[3] (value 400) — 525 chars · sample: `Ratified February 3, 1870, the 15th Amendment prohibited denial of the right to `
  * cat[0].clue[4] (value 500) — 585 chars · sample: `The four Progressive Era amendments — 16th (income tax, 1913), 17th (direct elec`
  * cat[1].clue[0] (value 100) — 590 chars · sample: `Incorporation is the legal process by which the Supreme Court, via the 14th Amen`
  * cat[1].clue[1] (value 200) — 532 chars · sample: `Section 1 of the 14th Amendment (1868) bars any state from denying 'equal protec`
  * cat[1].clue[2] (value 300) — 541 chars · sample: `Ratified January 23, 1964, the 24th Amendment abolished poll taxes as a requirem`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 594 chars

### `games/us-regents-sprint/Day 3 - Foreign Policy Wars Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 587 chars · sample: `In his 1796 Farewell Address, President George Washington warned against 'perman`
  * cat[0].clue[1] (value 200) — 546 chars · sample: `Declared by President James Monroe in December 1823, the Monroe Doctrine warned `
  * cat[0].clue[2] (value 300) — 593 chars · sample: `Coined by journalist John L. O'Sullivan in 1845, Manifest Destiny was the belief`
  * cat[0].clue[3] (value 400) — 548 chars · sample: `Proposed by Secretary of State John Hay in notes to European powers in 1899–1900`
  * cat[0].clue[4] (value 500) — 603 chars · sample: `Associated with Theodore Roosevelt's famous phrase 'speak softly and carry a big`
  * cat[1].clue[0] (value 100) — 596 chars · sample: `Developed by diplomat George Kennan in his 1946 'Long Telegram' and 1947 'X Arti`
  * cat[1].clue[1] (value 200) — 547 chars · sample: `On March 12, 1947, President Truman asked Congress to provide $400 million in mi`
  * cat[1].clue[2] (value 300) — 570 chars · sample: `Proposed by Secretary of State George Marshall in June 1947 and enacted in 1948,`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 691 chars

### `games/us-regents-sprint/Day 4 - Presidents Reformers Movements Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 584 chars · sample: `George Washington (president 1789–1797) established foundational precedents: a t`
  * cat[0].clue[1] (value 200) — 599 chars · sample: `Thomas Jefferson (president 1801–1809) was a strict constructionist who believed`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `James Monroe (president 1817–1825) presided over the 'Era of Good Feelings,' a p`
  * cat[0].clue[3] (value 400) — 614 chars · sample: `Andrew Jackson (president 1829–1837) championed Jacksonian Democracy — expanding`
  * cat[0].clue[4] (value 500) — 595 chars · sample: `James K. Polk (president 1845–1849) fulfilled Manifest Destiny through the annex`
  * cat[1].clue[0] (value 100) — 604 chars · sample: `Abraham Lincoln (president 1861–1865) preserved the Union through the Civil War,`
  * cat[1].clue[1] (value 200) — 607 chars · sample: `Theodore Roosevelt (president 1901–1909) reshaped the presidency as a 'bully pul`
  * cat[1].clue[2] (value 300) — 648 chars · sample: `Franklin D. Roosevelt (president 1933–1945) launched the New Deal — over 100 pro`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 652 chars

### `games/us-regents-sprint/Day 5 - Modern Issues Miscellaneous Review Game.html` — 26 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 625 chars · sample: `Signed by President Obama on March 23, 2010, the Affordable Care Act (ACA) creat`
  * cat[0].clue[1] (value 200) — 612 chars · sample: `In Obergefell v. Hodges (2015), the Supreme Court ruled 5–4 that the 14th Amendm`
  * cat[0].clue[2] (value 300) — 650 chars · sample: `In Dobbs v. Jackson Women's Health Organization (2022), the Supreme Court overru`
  * cat[0].clue[3] (value 400) — 681 chars · sample: `In Students for Fair Admissions v. Harvard (2023), the Supreme Court ruled 6–3 t`
  * cat[0].clue[4] (value 500) — 622 chars · sample: `In District of Columbia v. Heller (2008), the Supreme Court ruled 5–4 for the fi`
  * cat[1].clue[0] (value 100) — 692 chars · sample: `Signed by President Chester Arthur on May 6, 1882, the Chinese Exclusion Act bar`
  * cat[1].clue[1] (value 200) — 639 chars · sample: `The Emergency Quota Act (1921) and Immigration Act of 1924 (Johnson-Reed Act) im`
  * cat[1].clue[2] (value 300) — 665 chars · sample: `Deferred Action for Childhood Arrivals (DACA), created by President Obama throug`
  * ... and 17 more
* **final-explanation-too-verbose** (1)
  * final — 678 chars

### `games/ap-art-history-practice/practice-exam.html` — 26 flag(s), 40 items audited

* **prompt-missing-end-punct** (26)
  * q[0] id=apart-001 · sample: ` significant primarily because they are:`
  * q[4] id=apart-005 · sample: `the top shows Hammurabi standing before:`
  * q[5] id=apart-006 · sample: `0 BCE) were built primarily to serve as:`
  * q[7] id=apart-008 · sample: `c. 450–440 BCE) is best understood as a:`
  * q[9] id=apart-010 · sample: `venna, c. 547 CE) primarily communicate:`
  * q[11] id=apart-012 · sample: `point in European painting because they:`
  * q[12] id=apart-013 · sample: `ed in part because the painter includes:`
  * q[14] id=apart-015 · sample: `ale personification of Liberty is shown:`
  * ... and 18 more

### `games/algebra-2/01 - Function Families Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 622 chars · sample: `Domain is the set of all x-values for which f(x) is defined, a core F-IF.1 idea `
  * cat[0].clue[1] (value 200) — 599 chars · sample: `Range is the complete collection of y-values produced by a function (F-IF.1). Fo`
  * cat[0].clue[2] (value 300) — 550 chars · sample: `Function notation, written f(x), names the dependent variable produced by input `
  * cat[0].clue[3] (value 400) — 616 chars · sample: `A one-to-one function pairs distinct inputs with distinct outputs, so no horizon`
  * cat[0].clue[4] (value 500) — 543 chars · sample: `An inverse function f⁻¹ undoes f: if f(a)=b then f⁻¹(b)=a (F-BF.4). To find an i`
  * cat[1].clue[0] (value 100) — 596 chars · sample: `A vertical shift adds a constant k to the output (F-BF.3). y=f(x)+3 shifts every`
  * cat[1].clue[1] (value 200) — 571 chars · sample: `A horizontal shift changes the input by -h: y=f(x-h) shifts right h units when h`
  * cat[1].clue[2] (value 300) — 533 chars · sample: `A reflection flips the graph across an axis (F-BF.3). y=-f(x) reflects over the `
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 862 chars

### `games/ap-calculus-bc/08 - Applications of Integration Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 555 chars · sample: `For two curves y = f(x) and y = g(x) with f(x) >= g(x) on [a, b], the area betwe`
  * cat[0].clue[1] (value 200) — 507 chars · sample: `When two curves f and g cross within the integration interval, neither is always`
  * cat[0].clue[2] (value 300) — 509 chars · sample: `Integrating in y instead of x is preferable when the curves are more easily expr`
  * cat[0].clue[3] (value 400) — 508 chars · sample: `Area between y = x and y = x^2 on [0, 1]: the curves cross at x = 0 and x = 1, w`
  * cat[0].clue[4] (value 500) — 549 chars · sample: `A signed integral integral from a to b of f(x) dx represents NET AREA: positive `
  * cat[1].clue[0] (value 100) — 512 chars · sample: `Volume of solid of revolution about the x-axis using the disk method: V = pi * i`
  * cat[1].clue[1] (value 200) — 518 chars · sample: `Washer method for solid of revolution when the region has an inner radius r(x) (`
  * cat[1].clue[2] (value 300) — 513 chars · sample: `Volume when y = sqrt x is revolved about the x-axis from x = 0 to x = 4: disk me`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 600 chars

### `games/ap-chemistry/04 - Chemical Reactions Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 555 chars · sample: `Brønsted-Lowry acid-base reactions transfer a proton (H⁺) from an acid (donor) t`
  * cat[0].clue[1] (value 200) — 552 chars · sample: `The limiting reactant (LR) is the species fully consumed first in a reaction, so`
  * cat[0].clue[2] (value 300) — 602 chars · sample: `Percent yield = (actual yield / theoretical yield) × 100%. Theoretical yield is `
  * cat[0].clue[3] (value 400) — 557 chars · sample: `Combustion is the rapid reaction of a fuel (typically a hydrocarbon or other org`
  * cat[0].clue[4] (value 500) — 564 chars · sample: `A reducing agent (reductant) loses electrons (is oxidized itself) and donates th`
  * cat[1].clue[0] (value 100) — 590 chars · sample: `Avogadro's number, NA = 6.02214076 × 10²³ mol⁻¹, is the number of elementary ent`
  * cat[1].clue[1] (value 200) — 629 chars · sample: `In a solution, the solute is the substance present in smaller amount (or the one`
  * cat[1].clue[2] (value 300) — 502 chars · sample: `Assume 100 g sample: 40.0 g C, 6.7 g H, 53.3 g O. Moles: C = 40.0/12.01 = 3.33; `
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 589 chars

### `games/ap-computer-science-a/04 - Iteration Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 4.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 4.`
  * ... and 16 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-a/05 - Writing Classes Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 5.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 5.`
  * ... and 16 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-a/07 - ArrayList Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 7.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 7.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 7.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 7.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 7.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 7.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 7.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 7.`
  * ... and 16 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-a/09 - Inheritance Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 9.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 9.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 9.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 9.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 9.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 9.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 9.`
  * cat[1].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 9.`
  * ... and 16 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-principles/02 - Data Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 570 chars · sample: `Binary (base-2) underpins all digital computing — every transistor is on (1) or `
  * cat[0].clue[1] (value 200) — 542 chars · sample: `John Tukey coined 'bit' (Bell Labs 1947) as a portmanteau of binary digit. Claud`
  * cat[0].clue[2] (value 300) — 516 chars · sample: `ASCII (1963, ANSI X3.4) encodes 128 characters in 7 bits — letters, digits, punc`
  * cat[0].clue[3] (value 400) — 560 chars · sample: `RGB uses 8 bits per channel (0-255) for 24-bit color = 16.7 million combinations`
  * cat[0].clue[4] (value 500) — 589 chars · sample: `Huffman coding (David Huffman, MIT 1952) builds a binary tree where frequent sym`
  * cat[1].clue[0] (value 100) — 574 chars · sample: `Lossless compression (ZIP, PNG, FLAC) reduces file size while letting you recove`
  * cat[1].clue[1] (value 200) — 554 chars · sample: `Lossy compression (JPEG, MP3, MPEG) achieves much higher compression by throwing`
  * cat[1].clue[2] (value 300) — 552 chars · sample: `Run-length encoding compresses long runs — 'AAAAAA' becomes '6A.' RLE works bril`
  * ... and 17 more

### `games/ap-computer-science-principles/03 - Algorithms and Programming Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 598 chars · sample: `Variables associate a name with a value — score, userName, isLoggedIn. AP CSP re`
  * cat[0].clue[1] (value 200) — 536 chars · sample: `Lists in AP CSP are 1-indexed — list[1] is the first element, list[LENGTH(list)]`
  * cat[0].clue[2] (value 300) — 588 chars · sample: `FOR EACH item IN list (AP CSP reference) traverses a list assigning each element`
  * cat[0].clue[3] (value 400) — 599 chars · sample: `Local variables exist only inside their defining procedure — they are created on`
  * cat[0].clue[4] (value 500) — 589 chars · sample: `Strings store text. AP CSP reference sheet uses double-quoted strings: 'AP CSP'.`
  * cat[1].clue[0] (value 100) — 502 chars · sample: `REPEAT n TIMES in AP CSP reference sheet runs a block exactly n times. Equivalen`
  * cat[1].clue[1] (value 200) — 626 chars · sample: `Algorithms predate computers — al-Khwarizmi's 9th-century Arabic algebra book ga`
  * cat[1].clue[2] (value 300) — 521 chars · sample: `REPEAT UNTIL (condition) in AP CSP reference sheet runs until the condition beco`
  * ... and 17 more

### `games/ap-computer-science-principles/04 - Computer Systems and Networks Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 578 chars · sample: `The Internet evolved from ARPANET (1969, Bob Taylor at DARPA, first node UCLA Oc`
  * cat[0].clue[1] (value 200) — 584 chars · sample: `Protocols are conventions: TCP/IP, HTTP, HTTPS, FTP, SMTP. They specify packet f`
  * cat[0].clue[2] (value 300) — 645 chars · sample: `Fiber-optic cables transmit light through glass strands — modern long-haul fiber`
  * cat[0].clue[3] (value 400) — 549 chars · sample: `DNS (Paul Mockapetris, USC ISI 1983; RFC 1034/1035) is the Internet's phonebook `
  * cat[0].clue[4] (value 500) — 582 chars · sample: `The Internet scales because it is hierarchical (root DNS → TLD → authoritative; `
  * cat[1].clue[0] (value 100) — 562 chars · sample: `Packet switching breaks a message into packets; each is routed independently thr`
  * cat[1].clue[1] (value 200) — 618 chars · sample: `Routers connect networks — they read each packet's destination IP and forward it`
  * cat[1].clue[2] (value 300) — 599 chars · sample: `Fault tolerance comes from redundancy — many paths between any two nodes. Paul B`
  * ... and 17 more

### `games/ap-computer-science-principles/05 - Impact of Computing Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (25)
  * cat[0].clue[0] (value 100) — 676 chars · sample: `The digital divide separates broadband haves and have-nots. The term traces to a`
  * cat[0].clue[1] (value 200) — 667 chars · sample: `Cyberbullying uses digital channels to harass — repeated abuse via DMs, comments`
  * cat[0].clue[2] (value 300) — 673 chars · sample: `Deepfakes use generative AI (GANs by Ian Goodfellow 2014; diffusion models 2020+`
  * cat[0].clue[3] (value 400) — 633 chars · sample: `Cryptocurrencies use cryptography and decentralized ledgers (blockchain) — no ce`
  * cat[0].clue[4] (value 500) — 585 chars · sample: `Creative Commons (Lawrence Lessig, Hal Abelson, Eric Eldred — Stanford 2001) pro`
  * cat[1].clue[0] (value 100) — 617 chars · sample: `Crowdsourcing (Jeff Howe, Wired 2006) collects many small contributions to build`
  * cat[1].clue[1] (value 200) — 682 chars · sample: `Open source software (OSS) is freely available and modifiable. Richard Stallman'`
  * cat[1].clue[2] (value 300) — 647 chars · sample: `Copyright (US Copyright Act 1976, Berne Convention 1886) gives creators exclusiv`
  * ... and 17 more

### `games/ap-economics-combined/07 - Growth and International Economics Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 558 chars · sample: `Protectionism is the policy of restricting imports through tariffs, quotas, subs`
  * cat[0].clue[1] (value 200) — 555 chars · sample: `Comparative advantage exists when a producer can make a good at a lower opportun`
  * cat[0].clue[2] (value 300) — 513 chars · sample: `Terms of trade (TOT) is the ratio of export prices to import prices, showing how`
  * cat[0].clue[3] (value 400) — 535 chars · sample: `A tariff is a tax on imported goods that raises their domestic price, reducing i`
  * cat[0].clue[4] (value 500) — 566 chars · sample: `Currency appreciation is an increase in the value of a domestic currency relativ`
  * cat[1].clue[0] (value 100) — 567 chars · sample: `The foreign exchange (FX) market is where currencies are bought and sold, with e`
  * cat[1].clue[1] (value 200) — 558 chars · sample: `Specialization and trade mean producers focus on goods in which they have compar`
  * cat[1].clue[2] (value 300) — 570 chars · sample: `Appreciation means the domestic currency's value rises relative to foreign curre`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 535 chars

### `games/ap-english-literature/01 - Short Fiction I Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 576 chars · sample: `Plot is the structured sequence of events in a narrative. Aristotle's Poetics (3`
  * cat[0].clue[1] (value 200) — 551 chars · sample: `Exposition opens a narrative by establishing setting, characters, and inciting s`
  * cat[0].clue[2] (value 300) — 550 chars · sample: `Rising action escalates tension toward the climax through complications and conf`
  * cat[0].clue[3] (value 400) — 535 chars · sample: `Climax is the peak of conflict where the protagonist's fate pivots. In Sophocles`
  * cat[0].clue[4] (value 500) — 531 chars · sample: `Denouement, from French dénouement ('unknotting'), resolves remaining threads af`
  * cat[1].clue[0] (value 100) — 558 chars · sample: `Protagonist is the central character whose journey the narrative traces. Joyce's`
  * cat[1].clue[1] (value 200) — 548 chars · sample: `Antagonist embodies the opposing force, person, or system that resists the prota`
  * cat[1].clue[2] (value 300) — 586 chars · sample: `Round characters are fully developed with contradiction, depth, and capacity for`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 554 chars

### `games/ap-english-literature/03 - Longer Fiction and Drama I Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 605 chars · sample: `Five-act structure organizes a play into exposition, rising action, climax, fall`
  * cat[0].clue[1] (value 200) — 596 chars · sample: `Exposition in drama supplies background — setting, character relationships, prio`
  * cat[0].clue[2] (value 300) — 549 chars · sample: `Rising action in drama escalates conflict through choices and complications. Mac`
  * cat[0].clue[3] (value 400) — 539 chars · sample: `Climax in drama is the turning point at which the protagonist's fate is decided.`
  * cat[0].clue[4] (value 500) — 527 chars · sample: `Denouement (French: 'unknotting') resolves remaining plot threads after climax. `
  * cat[1].clue[0] (value 100) — 582 chars · sample: `Aristotle (384–322 BCE) defined tragedy in the Poetics (335 BCE) as 'an imitatio`
  * cat[1].clue[1] (value 200) — 536 chars · sample: `Hamartia is Aristotle's term (Poetics, 335 BCE) for the tragic protagonist's err`
  * cat[1].clue[2] (value 300) — 555 chars · sample: `Catharsis is Aristotle's term (Poetics, 335 BCE) for the audience's purgation of`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 570 chars

### `games/ap-english-literature/05 - Poetry II Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 527 chars · sample: `Petrarchan (Italian) sonnet, perfected by Francesco Petrarca (Canzoniere, 14th c`
  * cat[0].clue[1] (value 200) — 550 chars · sample: `Shakespearean (English) sonnet uses three quatrains plus a concluding couplet, r`
  * cat[0].clue[2] (value 300) — 556 chars · sample: `Volta is the Italian word for 'turn,' the structural pivot of a sonnet. In Petra`
  * cat[0].clue[3] (value 400) — 525 chars · sample: `Octave is the eight-line opening unit of a Petrarchan sonnet, conventionally rhy`
  * cat[0].clue[4] (value 500) — 529 chars · sample: `Sestet is the six-line closing unit of a Petrarchan sonnet, typically rhymed cde`
  * cat[1].clue[0] (value 100) — 587 chars · sample: `Lyric is a poem expressing personal emotion, perception, or thought, typically s`
  * cat[1].clue[1] (value 200) — 549 chars · sample: `Ode is an elaborate, often lengthy lyric of formal address, praising a subject. `
  * cat[1].clue[2] (value 300) — 545 chars · sample: `Elegy is a poem mourning the dead. The English elegiac tradition includes Milton`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 547 chars

### `games/ap-european-history/09 - Unit 9 Cold War and Contemporary Europe Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 544 chars · sample: `Containment, articulated by diplomat George Kennan in his 1946 'Long Telegram' a`
  * cat[0].clue[1] (value 200) — 502 chars · sample: `Détente (French for 'relaxation') described the easing of Cold War tensions in t`
  * cat[0].clue[2] (value 300) — 546 chars · sample: `The Cold War (1947-1991) was the ideological, political, and military rivalry be`
  * cat[0].clue[3] (value 400) — 571 chars · sample: `The postwar 'consumer society' emerged in Western Europe from the late 1950s: te`
  * cat[0].clue[4] (value 500) — 504 chars · sample: `The Warsaw Pact (1955) was the Soviet-led military alliance of Eastern European `
  * cat[1].clue[0] (value 100) — 558 chars · sample: `The postwar baby boom (c.1946-1964) saw a dramatic surge in birth rates across W`
  * cat[1].clue[1] (value 200) — 627 chars · sample: `West Germany, France, and Britain recruited 'guest workers' (Gastarbeiter) from `
  * cat[1].clue[2] (value 300) — 550 chars · sample: `The student and worker uprisings of 1968 peaked in Paris's 'May Events,' when st`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 612 chars

### `games/ap-german-language/05 - Contemporary Life Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[0] (value 100) — 17 chars · sample: `AP German Unit 5.`
  * cat[0].clue[1] (value 200) — 17 chars · sample: `AP German Unit 5.`
  * cat[0].clue[2] (value 300) — 17 chars · sample: `AP German Unit 5.`
  * cat[0].clue[3] (value 400) — 17 chars · sample: `AP German Unit 5.`
  * cat[0].clue[4] (value 500) — 17 chars · sample: `AP German Unit 5.`
  * cat[1].clue[0] (value 100) — 17 chars · sample: `AP German Unit 5.`
  * cat[1].clue[2] (value 300) — 17 chars · sample: `AP German Unit 5.`
  * cat[1].clue[3] (value 400) — 17 chars · sample: `AP German Unit 5.`
  * ... and 16 more
* **final-explanation-too-terse** (1)
  * final — 17 chars

### `games/ap-german-language/99 - Cumulative Yearlong Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (25)
  * cat[0].clue[0] (value 100) — 17 chars · sample: `AP German Unit 1.`
  * cat[0].clue[1] (value 200) — 17 chars · sample: `AP German Unit 2.`
  * cat[0].clue[2] (value 300) — 17 chars · sample: `AP German Unit 1.`
  * cat[0].clue[3] (value 400) — 17 chars · sample: `AP German Unit 1.`
  * cat[0].clue[4] (value 500) — 17 chars · sample: `AP German Unit 1.`
  * cat[1].clue[0] (value 100) — 17 chars · sample: `AP German Unit 1.`
  * cat[1].clue[1] (value 200) — 17 chars · sample: `AP German Unit 1.`
  * cat[1].clue[2] (value 300) — 17 chars · sample: `AP German Unit 3.`
  * ... and 17 more

### `games/ap-latin/01 - Vergil Aeneid Book 1 Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[1].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 1.`
  * ... and 16 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-latin/08 - Caesar BG Book 6 Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 8.`
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 8.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 8.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 8.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 8.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 8.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 8.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 8.`
  * ... and 16 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-macroeconomics/06 - Unit 6 Open Economy Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 595 chars · sample: `The balance of payments (BOP) is a comprehensive record of all economic transact`
  * cat[0].clue[1] (value 200) — 599 chars · sample: `An import quota is a quantity limit on the amount of a good that can be imported`
  * cat[0].clue[2] (value 300) — 665 chars · sample: `In balance of payments accounting, the financial account (often loosely called t`
  * cat[0].clue[3] (value 400) — 510 chars · sample: `Net exports (NX) = Exports (X) − Imports (M); it is the open-economy component o`
  * cat[0].clue[4] (value 500) — 617 chars · sample: `Current account policy refers to government measures targeting the trade balance`
  * cat[1].clue[0] (value 100) — 631 chars · sample: `Currency appreciation means the value of a currency rises relative to other curr`
  * cat[1].clue[1] (value 200) — 622 chars · sample: `In open-economy macroeconomics, depreciation refers to the decline in a currency`
  * cat[1].clue[2] (value 300) — 603 chars · sample: `The real exchange rate adjusts the nominal exchange rate for relative price leve`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 613 chars

### `games/ap-music-theory/03 - Music Fundamentals III Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 597 chars · sample: `First inversion: 3rd of chord is the lowest note. Example: C major triad first i`
  * cat[0].clue[1] (value 200) — 584 chars · sample: `Tonic: chord built on scale degree 1, the 'home' chord. Roman numeral I (major k`
  * cat[0].clue[2] (value 300) — 540 chars · sample: `7 figured bass: 7th chord in root position. Full figure 7/5/3 means: 7th, 5th, 3`
  * cat[0].clue[3] (value 400) — 528 chars · sample: `Doubling root: in I chord (or any major/minor triad), most commonly double the R`
  * cat[1].clue[0] (value 100) — 588 chars · sample: `Counterpoint: the art of combining independent melodic lines. From Latin 'punctu`
  * cat[1].clue[1] (value 200) — 535 chars · sample: `SATB: Soprano (highest), Alto, Tenor, Bass (lowest). Four-part chorale texture. `
  * cat[1].clue[2] (value 300) — 652 chars · sample: `Parallel motion: both voices move in same direction by same numerical interval. `
  * cat[1].clue[3] (value 400) — 619 chars · sample: `Forbidden parallels: parallel fifths (P5) and parallel octaves (P8/unisons). Rea`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 627 chars

### `games/ap-music-theory/05 - Harmony and Voice Leading II Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 537 chars · sample: `Pachelbel sequence: I-V-vi-iii-IV-I-IV-V uses descending circle-of-fifths motion`
  * cat[0].clue[1] (value 200) — 554 chars · sample: `Circle of 5ths sequence: chord roots descend by 5ths (or ascend by 4ths). Patter`
  * cat[0].clue[2] (value 300) — 534 chars · sample: `Tonic substitute: vi (in major) or VI (in minor, relative major). Shares two pit`
  * cat[0].clue[3] (value 400) — 557 chars · sample: `Secondary dominant V/V ('five of five'): the dominant chord OF the dominant chor`
  * cat[1].clue[0] (value 100) — 548 chars · sample: `Pre-dominant chords: ii (supertonic) and IV (subdominant). Both function to prep`
  * cat[1].clue[1] (value 200) — 526 chars · sample: `Ii6/5: first inversion of ii7 (the supertonic 7th chord). Bass = 3rd of chord. I`
  * cat[1].clue[2] (value 300) — 528 chars · sample: `Pedal 6/4: bass note remains stationary (pedal point) while harmony moves above.`
  * cat[1].clue[3] (value 400) — 556 chars · sample: `Iv in minor: pre-dominant function in minor key. ii° (diminished) is less common`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 609 chars

### `games/ap-physics-1/06 - Energy and Momentum of Rotating Systems Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 586 chars · sample: `Angular momentum L (kg * m^2 / s) is the rotational analog of linear momentum p.`
  * cat[0].clue[1] (value 200) — 570 chars · sample: `Angular momentum of a rigid body about a fixed axis: L = I omega (kg * m^2 / s),`
  * cat[0].clue[2] (value 300) — 524 chars · sample: `Angular momentum unit: kg * m^2 / s. Also writeable as N * m * s (the torque-tim`
  * cat[0].clue[3] (value 400) — 638 chars · sample: `Angular momentum is conserved when net external torque on the system is zero (ta`
  * cat[0].clue[4] (value 500) — 534 chars · sample: `When a figure skater pulls arms inward, I decreases (mass closer to spin axis), `
  * cat[1].clue[0] (value 100) — 627 chars · sample: `Angular momentum L is conserved when net external torque on the system is zero (`
  * cat[1].clue[1] (value 200) — 605 chars · sample: `Conservation of linear momentum: when F_ext = 0 on an isolated system, total mom`
  * cat[1].clue[2] (value 300) — 606 chars · sample: `Conservation of angular momentum: when tau_ext = 0 on an isolated rotational sys`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 668 chars

### `games/ap-physics-1/99 - Cumulative Yearlong Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 557 chars · sample: `F_net = m a (newtons = kg * m/s^2) — Newton's second law from Principia (1687). `
  * cat[0].clue[1] (value 200) — 547 chars · sample: `Kinetic energy KE = (1/2) m v^2 (joules). Always non-negative; scalar. Doubling `
  * cat[0].clue[2] (value 300) — 565 chars · sample: `Momentum p = m v (kg * m/s) — vector with direction of velocity. On the AP equat`
  * cat[0].clue[3] (value 400) — 600 chars · sample: `Torque tau = r F sin(theta) (N * m) — the rotational analog of force, what cause`
  * cat[0].clue[4] (value 500) — 601 chars · sample: `Friction (newtons) is a contact force parallel to surfaces opposing relative mot`
  * cat[1].clue[0] (value 100) — 540 chars · sample: `Kinetic energy KE = (1/2) m v^2 (joules). Scalar, always non-negative, scales qu`
  * cat[1].clue[1] (value 200) — 585 chars · sample: `Potential energy U (joules) — stored energy from position in a conservative-forc`
  * cat[1].clue[2] (value 300) — 526 chars · sample: `Work-Energy Theorem: W_net = Delta KE = KE_f - KE_i (joules). Derived by integra`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 652 chars

### `games/ap-us-government/99 - Cumulative Yearlong Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 516 chars · sample: `Enumerated (or expressed) powers are the specific authorities Article I, Section`
  * cat[0].clue[1] (value 200) — 531 chars · sample: `Limited government means that governmental authority is constrained by law, a co`
  * cat[0].clue[2] (value 300) — 553 chars · sample: `Popular sovereignty is the principle that all legitimate governmental authority `
  * cat[0].clue[3] (value 400) — 573 chars · sample: `The Senate filibuster allows senators to extend debate indefinitely to delay or `
  * cat[0].clue[4] (value 500) — 635 chars · sample: `Republicanism is the principle that government authority is exercised by elected`
  * cat[1].clue[0] (value 100) — 540 chars · sample: `Bicameralism divides Congress into the House (435 members, 2-year terms, apporti`
  * cat[1].clue[1] (value 200) — 518 chars · sample: `The presidential veto (Article I, Section 7) allows the president to reject a bi`
  * cat[1].clue[2] (value 300) — 530 chars · sample: `Article I, Section 8, Clause 18 — the 'elastic clause' — grants Congress power t`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 659 chars

### `games/chemistry-regents/02 - Periodic Table Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 556 chars · sample: `A period is a horizontal row on the Periodic Table, numbered 1-7. All elements i`
  * cat[0].clue[1] (value 200) — 560 chars · sample: `Groups (numbered 1-18 on the NYS Periodic Table) are vertical columns whose elem`
  * cat[0].clue[2] (value 300) — 530 chars · sample: `Family is a synonym for group on the Periodic Table, emphasizing the shared chem`
  * cat[0].clue[3] (value 400) — 567 chars · sample: `Metals occupy the left and central regions of the NYS Periodic Table (Groups 1-1`
  * cat[0].clue[4] (value 500) — 562 chars · sample: `Nonmetals cluster in the upper-right region of the NYS Periodic Table (plus hydr`
  * cat[1].clue[0] (value 100) — 530 chars · sample: `Atomic radius is reported in picometers (pm) on NYS Reference Table S. Moving le`
  * cat[1].clue[2] (value 300) — 581 chars · sample: `First ionization energy is listed on NYS Reference Table S in kJ/mol. Moving lef`
  * cat[1].clue[3] (value 400) — 571 chars · sample: `Electronegativity (Pauling scale) is tabulated on NYS Reference Table S. Fluorin`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 582 chars

### `games/chemistry-regents/07 - Acids, Bases, and Salts Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 585 chars · sample: `Svante Arrhenius proposed in 1884 that an acid is any substance that ionizes in `
  * cat[0].clue[1] (value 200) — 560 chars · sample: `Svante Arrhenius defined a base in 1884 as a substance that produces OH⁻ (hydrox`
  * cat[0].clue[2] (value 300) — 620 chars · sample: `Johannes Brønsted (Denmark) and Thomas Lowry (England) independently in 1923 red`
  * cat[0].clue[3] (value 400) — 553 chars · sample: `Brønsted and Lowry (1923) defined a base as a proton (H⁺) acceptor. The water mo`
  * cat[0].clue[4] (value 500) — 578 chars · sample: `An amphoteric (or amphiprotic) substance can either donate or accept a proton, d`
  * cat[1].clue[0] (value 100) — 584 chars · sample: `The pH scale, introduced by Søren Sørensen in 1909, runs from 0 (most acidic) th`
  * cat[1].clue[1] (value 200) — 548 chars · sample: `The hydronium ion (H₃O⁺) forms when an H⁺ from an acid attaches to a water molec`
  * cat[1].clue[2] (value 300) — 571 chars · sample: `The hydroxide ion (OH⁻) is released by Arrhenius bases dissolving in water: NaOH`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 586 chars

### `games/economics/05 - Government and Global Economy Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 511 chars · sample: `Taxation is the compulsory collection of money by government from households and`
  * cat[0].clue[1] (value 200) — 528 chars · sample: `Progressive taxation is a system where average tax rates rise with taxable incom`
  * cat[0].clue[3] (value 400) — 531 chars · sample: `Public goods are simultaneously non-excludable (no one can be prevented from con`
  * cat[0].clue[4] (value 500) — 508 chars · sample: `The social safety net is the collection of government programs — Social Security`
  * cat[1].clue[0] (value 100) — 551 chars · sample: `Fiscal policy uses government spending and taxation to influence aggregate deman`
  * cat[1].clue[1] (value 200) — 529 chars · sample: `A budget deficit occurs when government expenditures exceed tax revenues in a gi`
  * cat[1].clue[2] (value 300) — 537 chars · sample: `The inflation rate is the percentage change in a price index (usually CPI or PCE`
  * cat[1].clue[3] (value 400) — 510 chars · sample: `The unemployment rate measures the percentage of the labor force actively lookin`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 549 chars

### `games/global-9/04 - Trade Networks Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 520 chars · sample: `The Silk Roads were a network of overland and maritime trade routes connecting C`
  * cat[0].clue[1] (value 200) — 575 chars · sample: `The Black Death (1347–1353 CE) was the deadliest pandemic in recorded history, k`
  * cat[0].clue[2] (value 300) — 514 chars · sample: `Caravans — organized groups of merchants and their pack animals (camels in the d`
  * cat[0].clue[3] (value 400) — 514 chars · sample: `Cultural diffusion is the process by which ideas, technologies, languages, relig`
  * cat[0].clue[4] (value 500) — 533 chars · sample: `The Pax Mongolica ('Mongol Peace') refers to the relative stability and security`
  * cat[1].clue[0] (value 100) — 535 chars · sample: `Indian Ocean trade (c. 100 BCE–1500 CE) was the world's most extensive maritime `
  * cat[1].clue[1] (value 200) — 563 chars · sample: `Monsoon winds are seasonal winds driven by the differential heating of land and `
  * cat[1].clue[2] (value 300) — 578 chars · sample: `The lateen sail — a triangular sail mounted at a 45-degree angle to the mast — w`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 590 chars

### `games/grade-7/03 - American Independence Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[1] (value 200) — 511 chars · sample: `In 1754, Benjamin Franklin proposed the Albany Plan of Union at a congress of se`
  * cat[0].clue[2] (value 300) — 558 chars · sample: `The Treaty of Paris (1763) ended the Seven Years' War and dramatically redrawn t`
  * cat[0].clue[3] (value 400) — 533 chars · sample: `After winning the French and Indian War, Britain issued the Proclamation of 1763`
  * cat[0].clue[4] (value 500) — 557 chars · sample: `After Britain won the French and Indian War, it occupied former French forts and`
  * cat[1].clue[0] (value 100) — 585 chars · sample: `The Stamp Act of 1765 required colonists to pay a tax on nearly every printed do`
  * cat[1].clue[1] (value 200) — 513 chars · sample: `The Townshend Acts (1767) were a set of laws imposing taxes on goods imported to`
  * cat[1].clue[2] (value 300) — 507 chars · sample: `The Tea Act of 1773 gave the British East India Company the exclusive right to s`
  * cat[1].clue[3] (value 400) — 578 chars · sample: `After the Boston Tea Party, Britain passed five laws that colonists called the I`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 596 chars

### `games/grade-7/04 - Historical Development of the Constitution Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 510 chars · sample: `The Articles of Confederation were America's first governing document, ratified `
  * cat[0].clue[2] (value 300) — 564 chars · sample: `The Preamble is the Constitution's 52-word opening statement: 'We the People of `
  * cat[0].clue[3] (value 400) — 501 chars · sample: `The Northwest Ordinance of 1787 was one of the most successful laws passed under`
  * cat[0].clue[4] (value 500) — 593 chars · sample: `Shays' Rebellion (1786–87) erupted when Massachusetts farmers — many veterans wh`
  * cat[1].clue[0] (value 100) — 525 chars · sample: `The Virginia Plan, drafted largely by James Madison and presented by Edmund Rand`
  * cat[1].clue[1] (value 200) — 527 chars · sample: `The Great Compromise (also called the Connecticut Compromise), proposed by Roger`
  * cat[1].clue[2] (value 300) — 521 chars · sample: `The New Jersey Plan, proposed by William Paterson of New Jersey in June 1787, wa`
  * cat[1].clue[3] (value 400) — 557 chars · sample: `The Three-Fifths Compromise resolved the question of how to count enslaved peopl`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 625 chars

### `games/grade-7/06 - Westward Expansion Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 574 chars · sample: `The Louisiana Purchase (1803) was one of the most consequential real estate deal`
  * cat[0].clue[1] (value 200) — 552 chars · sample: `The Lewis and Clark Expedition (1804–1806) sent Meriwether Lewis and William Cla`
  * cat[0].clue[2] (value 300) — 574 chars · sample: `Manifest Destiny was the powerful 19th-century belief that the United States was`
  * cat[0].clue[3] (value 400) — 590 chars · sample: `The frontier was the moving edge of American settlement as it pushed westward — `
  * cat[0].clue[4] (value 500) — 609 chars · sample: `The Oregon Trail was a 2,000-mile overland route that hundreds of thousands of A`
  * cat[1].clue[0] (value 100) — 599 chars · sample: `The Indian Removal Act of 1830, pushed through Congress by President Andrew Jack`
  * cat[1].clue[1] (value 200) — 652 chars · sample: `The Trail of Tears refers primarily to the 1838–1839 forced removal of the Chero`
  * cat[1].clue[2] (value 300) — 636 chars · sample: `A reservation is land designated by the U.S. government for Native peoples to li`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 622 chars

### `games/grade-7/99 - Cumulative Yearlong Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[0] (value 100) — 508 chars · sample: `The Haudenosaunee ('People of the Longhouse') formed one of the most sophisticat`
  * cat[0].clue[1] (value 200) — 545 chars · sample: `A culture area is a region where neighboring Native nations adapted to the same `
  * cat[0].clue[2] (value 300) — 526 chars · sample: `Mercantilism was the dominant European economic theory of the 1600s–1700s: a nat`
  * cat[0].clue[3] (value 400) — 545 chars · sample: `New Netherland was the Dutch West India Company's North American colony, establi`
  * cat[0].clue[4] (value 500) — 536 chars · sample: `The triangular trade was the interconnected Atlantic commerce system that enrich`
  * cat[1].clue[0] (value 100) — 515 chars · sample: `The French and Indian War (1754–1763) was the North American phase of the Seven `
  * cat[1].clue[1] (value 200) — 607 chars · sample: `The Stamp Act of 1765 required colonists to pay a tax on virtually every printed`
  * cat[1].clue[2] (value 300) — 574 chars · sample: `Natural rights, developed by philosopher John Locke, holds that all human beings`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 573 chars

### `games/us-history-units/09 - Cold War Jeopardy Review.html` — 25 flag(s), 26 items audited

* **explanation-too-verbose** (24)
  * cat[0].clue[1] (value 200) — 533 chars · sample: `The Strategic Arms Limitation Talks produced SALT I (1972) and SALT II (1979), t`
  * cat[0].clue[2] (value 300) — 591 chars · sample: `The Berlin Airlift (June 1948 – May 1949) was the Western response to the Soviet`
  * cat[0].clue[3] (value 400) — 567 chars · sample: `The Truman Doctrine (March 1947) was President Truman's declaration to Congress `
  * cat[0].clue[4] (value 500) — 590 chars · sample: `The Cuban Missile Crisis (October 16–28, 1962) was the Cold War's most dangerous`
  * cat[1].clue[0] (value 100) — 576 chars · sample: `Winston Churchill coined the term 'Iron Curtain' in his March 5, 1946 Fulton, Mi`
  * cat[1].clue[1] (value 200) — 572 chars · sample: `NATO (North Atlantic Treaty Organization), established April 4, 1949 by the U.S.`
  * cat[1].clue[2] (value 300) — 605 chars · sample: `The Marshall Plan (European Recovery Program, 1948–51), proposed by Secretary of`
  * cat[1].clue[3] (value 400) — 578 chars · sample: `The War Powers Resolution (1973), passed over Nixon's veto in the wake of the un`
  * ... and 16 more
* **final-explanation-too-verbose** (1)
  * final — 592 chars

### `games/ap-calculus-bc/03 - Composite, Implicit, Inverse Differentiation Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 536 chars · sample: `Chain rule: d/dx of f(g(x)) = f'(g(x)) g'(x). Discovered by Leibniz (1676) and f`
  * cat[0].clue[1] (value 200) — 530 chars · sample: `Power-of-composition: d/dx of (3x + 1)^5 = 5 (3x + 1)^4 * d/dx of (3x + 1) = 5 (`
  * cat[0].clue[2] (value 300) — 543 chars · sample: `Chain rule with outer sin and inner u = x^2: d/dx of sin(x^2) = cos(x^2) * d/dx `
  * cat[0].clue[3] (value 400) — 529 chars · sample: `Chain rule: d/dx of e^(3x) = e^(3x) * d/dx of 3x = 3 e^(3x). Generalizes to d/dx`
  * cat[0].clue[4] (value 500) — 553 chars · sample: `Chain rule on ln: d/dx of ln(f(x)) = (1/f(x)) * f'(x) = f'(x) / f(x), valid wher`
  * cat[1].clue[1] (value 200) — 544 chars · sample: `Differentiate x^2 + y^2 = 25 implicitly with respect to x: 2x + 2y y' = 0, so y'`
  * cat[1].clue[2] (value 300) — 539 chars · sample: `Since y is implicitly a function of x, d/dx of y^2 = 2y * dy/dx by chain rule wi`
  * cat[1].clue[3] (value 400) — 549 chars · sample: `Given a point (x_0, y_0) on the implicit curve F(x, y) = 0 and the slope m = dy/`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 690 chars

### `games/ap-chemistry/05 - Kinetics Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 570 chars · sample: `A rate law expresses reaction rate as rate = k[A]^m[B]^n, where k is the rate co`
  * cat[0].clue[1] (value 200) — 538 chars · sample: `For a first-order reaction, the integrated rate law is ln[A]_t = −kt + ln[A]_0. `
  * cat[0].clue[2] (value 300) — 647 chars · sample: `Collision theory states that reactions occur when molecules collide with (1) suf`
  * cat[0].clue[3] (value 400) — 557 chars · sample: `The method of initial rates determines reaction orders by running multiple trial`
  * cat[0].clue[4] (value 500) — 613 chars · sample: `The Maxwell-Boltzmann distribution gives the probability of a molecule having a `
  * cat[1].clue[0] (value 100) — 658 chars · sample: `A reaction mechanism is the step-by-step molecular pathway by which reactants be`
  * cat[1].clue[1] (value 200) — 616 chars · sample: `The rate-determining step (RDS) is the slowest elementary step in a multi-step m`
  * cat[1].clue[2] (value 300) — 594 chars · sample: `An intermediate is a species produced in one elementary step and consumed in a l`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 572 chars

### `games/ap-computer-science-a/01 - Primitive Types Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-terse** (23)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[0].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 1.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 1.`
  * ... and 15 more
* **final-explanation-too-terse** (1)
  * final — 14 chars

### `games/ap-computer-science-a/10 - Recursion Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-terse** (23)
  * cat[0].clue[0] (value 100) — 15 chars · sample: `AP CSA Unit 10.`
  * cat[0].clue[1] (value 200) — 15 chars · sample: `AP CSA Unit 10.`
  * cat[0].clue[2] (value 300) — 15 chars · sample: `AP CSA Unit 10.`
  * cat[0].clue[3] (value 400) — 15 chars · sample: `AP CSA Unit 10.`
  * cat[0].clue[4] (value 500) — 15 chars · sample: `AP CSA Unit 10.`
  * cat[1].clue[0] (value 100) — 15 chars · sample: `AP CSA Unit 10.`
  * cat[1].clue[1] (value 200) — 15 chars · sample: `AP CSA Unit 10.`
  * cat[1].clue[2] (value 300) — 15 chars · sample: `AP CSA Unit 10.`
  * ... and 15 more
* **final-explanation-too-terse** (1)
  * final — 15 chars

### `games/ap-european-history/05 - Unit 5 Conflict, Crisis, and Reaction Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 526 chars · sample: `The Estates-General, France's dormant representative assembly of clergy (First E`
  * cat[0].clue[1] (value 200) — 510 chars · sample: `Popular sovereignty holds that legitimate government derives from the people's c`
  * cat[0].clue[2] (value 300) — 514 chars · sample: `When the Estates-General deadlocked over voting, the Third Estate renamed itself`
  * cat[0].clue[4] (value 500) — 510 chars · sample: `The levee en masse (August 23, 1793) was the Committee of Public Safety's decree`
  * cat[1].clue[0] (value 100) — 524 chars · sample: `Napoleon Bonaparte (1769-1821) rose from Corsican-born artillery officer to Empe`
  * cat[1].clue[1] (value 200) — 567 chars · sample: `Nationalism — the conviction that people sharing language, culture, or ethnicity`
  * cat[1].clue[2] (value 300) — 540 chars · sample: `The French Revolution (1789-1799) dismantled the Old Regime's social hierarchy a`
  * cat[1].clue[3] (value 400) — 526 chars · sample: `The Napoleonic Code (Code Civil, 1804) standardized French law: it enshrined equ`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 533 chars

### `games/ap-european-history/07 - Unit 7 19th-Century Perspectives and Political Developments Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 556 chars · sample: `Auguste Comte (1798-1857) coined 'positivism' — the doctrine that only empirical`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `Social Darwinism applied Darwin's biological concepts — struggle for existence, `
  * cat[0].clue[3] (value 400) — 575 chars · sample: `Zionism — the movement for a Jewish homeland — was founded as a political moveme`
  * cat[0].clue[4] (value 500) — 536 chars · sample: `France's Third Republic (1870-1940) — born from the ruins of Napoleon III's defe`
  * cat[1].clue[0] (value 100) — 562 chars · sample: `Italian unification (Risorgimento, 1848-1871) proceeded in stages: Cavour (Piedm`
  * cat[1].clue[1] (value 200) — 525 chars · sample: `The Crimean War (1853-1856) pitted Russia against the Ottoman Empire, Britain, F`
  * cat[1].clue[2] (value 300) — 572 chars · sample: `First-wave feminism (c.1848-1920) demanded legal equality for women: property ri`
  * cat[1].clue[3] (value 400) — 538 chars · sample: `Otto von Bismarck (1815-1898) served as Prussia's Minister-President (1862-90) a`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 585 chars

### `games/ap-european-history/08 - Unit 8 20th-Century Global Conflicts Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 536 chars · sample: `The League of Nations, proposed by Woodrow Wilson as his Fourteenth Point and es`
  * cat[0].clue[1] (value 200) — 532 chars · sample: `Pre-1914 militarism described the glorification of military power and the arms r`
  * cat[0].clue[2] (value 300) — 514 chars · sample: `The pre-1914 alliance system divided Europe into two armed blocs: the Triple All`
  * cat[0].clue[3] (value 400) — 528 chars · sample: `Collective security — the principle that states should respond collectively to a`
  * cat[0].clue[4] (value 500) — 523 chars · sample: `The Treaty of Versailles (June 28, 1919) formally ended WWI, imposing on Germany`
  * cat[1].clue[0] (value 100) — 532 chars · sample: `Fascism — Benito Mussolini coined the term — was an authoritarian, ultranational`
  * cat[1].clue[1] (value 200) — 506 chars · sample: `The 'home front' refers to the civilian dimension of total war: rationing, munit`
  * cat[1].clue[2] (value 300) — 503 chars · sample: `Nazism (National Socialism) combined extreme German nationalism, racial antisemi`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 546 chars

### `games/ap-french-language/99 - AP French Language Cumulative Yearlong Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 630 chars · sample: `Cependant is the most useful adversative connector for AP French Language essays`
  * cat[0].clue[1] (value 200) — 583 chars · sample: `De plus is a high-frequency additive connector for AP French Language essays. Us`
  * cat[0].clue[2] (value 300) — 623 chars · sample: `Indicatif for objective facts/known reality; subjonctif for subjectivity. Trigge`
  * cat[0].clue[3] (value 400) — 586 chars · sample: `Futur for predictions and announcements; conditionnel for hypothetical (would), `
  * cat[0].clue[4] (value 500) — 640 chars · sample: `AP French Language past participle agreement rules: (1) With être (motion verbs,`
  * cat[1].clue[0] (value 100) — 510 chars · sample: `Les familles et les communautés is Theme 1 of the AP French Language CED, coveri`
  * cat[1].clue[1] (value 200) — 544 chars · sample: `Les identités personnelles et publiques is Theme 2 of the AP French Language CED`
  * cat[1].clue[2] (value 300) — 539 chars · sample: `La beauté et l'esthétique is Theme 3 of the AP French Language CED, covering Mon`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 739 chars

### `games/ap-german-language/02 - Personal and Public Identities Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-terse** (23)
  * cat[0].clue[0] (value 100) — 17 chars · sample: `AP German Unit 2.`
  * cat[0].clue[1] (value 200) — 17 chars · sample: `AP German Unit 2.`
  * cat[0].clue[2] (value 300) — 17 chars · sample: `AP German Unit 2.`
  * cat[0].clue[3] (value 400) — 17 chars · sample: `AP German Unit 2.`
  * cat[0].clue[4] (value 500) — 17 chars · sample: `AP German Unit 2.`
  * cat[1].clue[0] (value 100) — 17 chars · sample: `AP German Unit 2.`
  * cat[1].clue[1] (value 200) — 17 chars · sample: `AP German Unit 2.`
  * cat[1].clue[2] (value 300) — 17 chars · sample: `AP German Unit 2.`
  * ... and 15 more
* **final-explanation-too-terse** (1)
  * final — 17 chars

### `games/ap-latin/06 - Caesar BG Book 1 Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-terse** (23)
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 6.`
  * ... and 15 more
* **final-explanation-too-terse** (1)
  * final — 16 chars

### `games/ap-latin/99 - Cumulative Yearlong Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-terse** (24)
  * cat[0].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 1.`
  * cat[0].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 3.`
  * cat[0].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 4.`
  * cat[0].clue[4] (value 500) — 16 chars · sample: `AP Latin Unit 5.`
  * cat[1].clue[0] (value 100) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[1] (value 200) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[2] (value 300) — 16 chars · sample: `AP Latin Unit 6.`
  * cat[1].clue[3] (value 400) — 16 chars · sample: `AP Latin Unit 6.`
  * ... and 16 more

### `games/ap-macroeconomics/02 - Unit 2 Economic Indicators and the Business Cycle Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[1] (value 200) — 543 chars · sample: `A demand shock is a sudden, unexpected change in aggregate demand — the AD curve`
  * cat[0].clue[2] (value 300) — 558 chars · sample: `The SRAS curve shows the total quantity of output supplied at each price level w`
  * cat[0].clue[3] (value 400) — 522 chars · sample: `The LRAS curve is vertical at potential GDP (full-employment output, Y*), the le`
  * cat[0].clue[4] (value 500) — 554 chars · sample: `Stagflation combines stagnant output (recession/high unemployment) with high inf`
  * cat[1].clue[0] (value 100) — 536 chars · sample: `Inflation is a sustained general increase in the price level, measured most comm`
  * cat[1].clue[1] (value 200) — 585 chars · sample: `GDP is the market value of all final goods and services produced within a countr`
  * cat[1].clue[2] (value 300) — 530 chars · sample: `Nominal GDP measures total output at current market prices without adjusting for`
  * cat[1].clue[3] (value 400) — 566 chars · sample: `A recessionary gap (negative output gap) exists when actual real GDP (the AD-SRA`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 517 chars

### `games/ap-music-theory/04 - Harmony and Voice Leading I Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 539 chars · sample: `Perfect Authentic Cadence (PAC): V (or V7) to I, both in root position, soprano `
  * cat[0].clue[1] (value 200) — 577 chars · sample: `Phrase: smallest complete musical unit ending in a cadence. Typically 4 measures`
  * cat[0].clue[2] (value 300) — 585 chars · sample: `Parallel 3rds and 6ths: permitted (and beautiful) in tonal music. Inversions of `
  * cat[0].clue[3] (value 400) — 569 chars · sample: `Plagal Cadence: IV-I motion. Often called 'Amen cadence' because traditionally s`
  * cat[0].clue[4] (value 500) — 523 chars · sample: `Imperfect Authentic Cadence (IAC): V-I motion, but NOT meeting strict PAC criter`
  * cat[1].clue[0] (value 100) — 564 chars · sample: `Half Cadence (HC): phrase ends on V chord, creating sense of pause but NOT closu`
  * cat[1].clue[1] (value 200) — 569 chars · sample: `Parallel Period: two phrases (antecedent + consequent), each typically 4 measure`
  * cat[1].clue[2] (value 300) — 640 chars · sample: `Deceptive Cadence: V resolves to vi (or VI in minor: relative major) instead of `
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 659 chars

### `games/ap-music-theory/07 - Harmony and Voice Leading IV Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 528 chars · sample: `V/V (V of V, 'five of five'): the V chord OF the V chord. In C major: V = G majo`
  * cat[0].clue[1] (value 200) — 588 chars · sample: `Shift from one key to another within a composition. Establishes new tonic. Types`
  * cat[0].clue[2] (value 300) — 528 chars · sample: `Raised 4: scale degree 4 raised by half step creates secondary leading tone for `
  * cat[0].clue[4] (value 500) — 536 chars · sample: `V/V-V-I: intensified cadential progression. The V/V leads into V (tonicizing V m`
  * cat[1].clue[0] (value 100) — 612 chars · sample: `Closely related keys: differ by 1 accidental (1 sharp or 1 flat away on circle o`
  * cat[1].clue[1] (value 200) — 561 chars · sample: `Pivot chord modulation: shared chord serves as bridge between two keys. Example:`
  * cat[1].clue[2] (value 300) — 552 chars · sample: `Sonata-form modulation (major key): exposition modulates from I (tonic) to V (do`
  * cat[1].clue[3] (value 400) — 581 chars · sample: `Sonata-form modulation (minor key): from i (minor tonic) to III (relative major)`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 630 chars

### `games/ap-physics-1/02 - Force and Translational Dynamics Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 607 chars · sample: `Newton's first law (1687): an object at rest stays at rest, and an object in mot`
  * cat[0].clue[1] (value 200) — 549 chars · sample: `F_net = m a (newtons = kg * m/s^2). Newton's second law from Principia (1687) — `
  * cat[0].clue[2] (value 300) — 573 chars · sample: `Newton's third law (1687): for every action force F_{AB}, there is an equal-magn`
  * cat[0].clue[3] (value 400) — 553 chars · sample: `Momentum p = m v (kg * m/s) is a vector. Newton actually wrote his second law in`
  * cat[0].clue[4] (value 500) — 536 chars · sample: `F_net = dp/dt — the original form of Newton's second law as Newton wrote it. For`
  * cat[1].clue[0] (value 100) — 589 chars · sample: `Friction is a contact force parallel to surfaces, opposing relative motion (kine`
  * cat[1].clue[1] (value 200) — 568 chars · sample: `Static friction f_s adjusts up to a maximum f_{s,max} = mu_s N (newtons), where `
  * cat[1].clue[2] (value 300) — 594 chars · sample: `Kinetic friction f_k = mu_k N (newtons) — constant magnitude (to AP-level approx`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 641 chars

### `games/ap-physics-c-em/02 - Gauss's Law Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 571 chars · sample: `Electric flux Phi_E through a surface is the integral Phi_E = integral E . dA, w`
  * cat[0].clue[1] (value 200) — 546 chars · sample: `Flux through a flat surface in uniform field is Phi_E = E . A = E*A*cos(theta), `
  * cat[0].clue[4] (value 500) — 527 chars · sample: `Sign convention for flux: outward flux through a closed surface is positive. AP `
  * cat[1].clue[0] (value 100) — 656 chars · sample: `Gauss's law states that the electric flux through any closed surface equals the `
  * cat[1].clue[1] (value 200) — 580 chars · sample: `Gauss's law equation: closed integral of E . dA = Q_enclosed/epsilon_0. AP Physi`
  * cat[1].clue[2] (value 300) — 552 chars · sample: `Epsilon_0 (epsilon-naught) is the permittivity of free space, with value epsilon`
  * cat[1].clue[3] (value 400) — 624 chars · sample: `For spherical symmetry the Gaussian surface is a sphere centered on the charge d`
  * cat[1].clue[4] (value 500) — 626 chars · sample: `For cylindrical symmetry the Gaussian surface is a cylinder coaxial with the cha`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 1011 chars

### `games/ap-psychology/06 - Clinical and Positive Psychology Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 502 chars · sample: `The DSM-5-TR (Diagnostic and Statistical Manual of Mental Disorders, 5th edition`
  * cat[0].clue[2] (value 300) — 549 chars · sample: `OCD (Obsessive-Compulsive Disorder) involves intrusive, unwanted obsessions (rec`
  * cat[0].clue[3] (value 400) — 560 chars · sample: `PTSD (Post-Traumatic Stress Disorder) develops after exposure to actual or threa`
  * cat[0].clue[4] (value 500) — 573 chars · sample: `Major Depressive Disorder (MDD) requires at least two weeks of depressed mood or`
  * cat[1].clue[0] (value 100) — 509 chars · sample: `Bipolar disorder involves episodes of mania (elevated/irritable mood, decreased `
  * cat[1].clue[1] (value 200) — 534 chars · sample: `Schizophrenia is a severe psychotic disorder characterized by positive symptoms `
  * cat[1].clue[2] (value 300) — 535 chars · sample: `Delusions are fixed, false beliefs that persist despite contradictory evidence a`
  * cat[1].clue[4] (value 500) — 556 chars · sample: `The medical model treats psychological disorders as diseases with biological cau`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 606 chars

### `games/ap-statistics/99 - Cumulative Yearlong Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 639 chars · sample: `The median is the middle value of an ordered data set (50th percentile). Unlike `
  * cat[0].clue[1] (value 200) — 581 chars · sample: `The interquartile range IQR = Q3 - Q1 measures the spread of the middle 50 perce`
  * cat[0].clue[2] (value 300) — 550 chars · sample: `A scatterplot displays the relationship between two quantitative variables. AP S`
  * cat[0].clue[3] (value 400) — 556 chars · sample: `The coefficient of determination r-squared is the proportion of variation in y e`
  * cat[0].clue[4] (value 500) — 562 chars · sample: `A z-score z = (x - mu)/sigma standardizes an observation by expressing its dista`
  * cat[1].clue[0] (value 100) — 565 chars · sample: `Probability is the long-run relative frequency of an event - the proportion of t`
  * cat[1].clue[1] (value 200) — 522 chars · sample: `Conditional probability P(A|B) is the probability of A given B has occurred: P(A`
  * cat[1].clue[2] (value 300) — 535 chars · sample: `The binomial distribution describes the number of successes X in n independent t`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 847 chars

### `games/ap-us-government/03 - Unit 3 Civil Liberties and Civil Rights Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[1] (value 200) — 504 chars · sample: `The Free Exercise Clause protects individuals' right to practice their religion `
  * cat[0].clue[2] (value 300) — 569 chars · sample: `Schenck v. United States (1919), decided unanimously with Justice Oliver Wendell`
  * cat[0].clue[3] (value 400) — 542 chars · sample: `Tinker v. Des Moines Independent Community School District (1969), decided 7-2, `
  * cat[0].clue[4] (value 500) — 560 chars · sample: `New York Times v. United States (1971), decided 6-3 per curiam, rejected the Nix`
  * cat[1].clue[0] (value 100) — 560 chars · sample: `The Due Process Clause of the 14th Amendment (1868) — 'nor shall any State depri`
  * cat[1].clue[1] (value 200) — 547 chars · sample: `Selective incorporation is the judicial process by which the Supreme Court has a`
  * cat[1].clue[3] (value 400) — 591 chars · sample: `Wisconsin v. Yoder (1972), decided 6-1 by Chief Justice Burger, ruled that Wisco`
  * cat[1].clue[4] (value 500) — 548 chars · sample: `Engel v. Vitale (1962), decided 6-1 by Justice Hugo Black, struck down a brief n`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 635 chars

### `games/ap-us-government/04 - Unit 4 Political Ideologies and Beliefs Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 558 chars · sample: `Political socialization is the lifelong process through which individuals develo`
  * cat[0].clue[2] (value 300) — 547 chars · sample: `A generational effect (or cohort effect) occurs when a significant historical ev`
  * cat[0].clue[3] (value 400) — 528 chars · sample: `The gender gap refers to the consistent difference in political attitudes and vo`
  * cat[0].clue[4] (value 500) — 574 chars · sample: `Political efficacy measures citizens' belief in their ability to understand poli`
  * cat[1].clue[0] (value 100) — 530 chars · sample: `Public opinion is the distribution of individual attitudes and preferences about`
  * cat[1].clue[1] (value 200) — 548 chars · sample: `Scientific polling uses probability-based random sampling to estimate the opinio`
  * cat[1].clue[2] (value 300) — 527 chars · sample: `Opinion polling uses structured surveys to measure the distribution of public at`
  * cat[1].clue[3] (value 400) — 506 chars · sample: `A random sample is a subset of a population in which every individual has an equ`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 648 chars

### `games/grade-5-math/01 - Place Value and Decimals Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 568 chars · sample: `Worked example: in 4,444, each digit 4 occupies a different place, and place val`
  * cat[0].clue[1] (value 200) — 533 chars · sample: `Worked example: 0.07 has a 0 in the ones place, 0 in the tenths place, and 7 in `
  * cat[0].clue[2] (value 300) — 525 chars · sample: `Worked example: in 4,444 the 4 in the tens column = 40, and the 4 to its LEFT in`
  * cat[0].clue[3] (value 400) — 502 chars · sample: `Worked example: 'one tenth greater than 4.27' means add 0.1 to 4.27. Line up the`
  * cat[0].clue[4] (value 500) — 513 chars · sample: `Worked example: 0.6 and 0.60 both equal six tenths, because the trailing zero in`
  * cat[1].clue[1] (value 200) — 553 chars · sample: `Worked example: 'three and forty-two thousandths' means the whole number is 3, t`
  * cat[1].clue[2] (value 300) — 569 chars · sample: `Worked example: multiplying by 10 shifts every digit one place to the LEFT (5.NB`
  * cat[1].clue[3] (value 400) — 533 chars · sample: `Worked example: 63 ÷ 100 means split 63 into 100 equal parts; each part is 0.63 `
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 587 chars

### `games/us-history-units/07 - Prosperity and Depression Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 593 chars · sample: `The Harlem Renaissance was a Black cultural, artistic, and intellectual flowerin`
  * cat[0].clue[1] (value 200) — 525 chars · sample: `Prohibition — the nationwide ban on manufacturing, selling, and transporting alc`
  * cat[0].clue[3] (value 400) — 564 chars · sample: `Flappers were young women of the 1920s who defied traditional gender norms by we`
  * cat[0].clue[4] (value 500) — 554 chars · sample: `The Scopes Trial (July 1925) pitted Tennessee teacher John Scopes, charged under`
  * cat[1].clue[0] (value 100) — 536 chars · sample: `The (First) Red Scare (1919–20) was a wave of anti-communist fear following the `
  * cat[1].clue[1] (value 200) — 578 chars · sample: `Nativism — the preference for native-born Americans over immigrants — surged in `
  * cat[1].clue[2] (value 300) — 511 chars · sample: `Nicola Sacco and Bartolomeo Vanzetti, Italian immigrant anarchists, were arreste`
  * cat[1].clue[3] (value 400) — 536 chars · sample: `The Emergency Quota Act (1921) and Immigration Act of 1924 (National Origins Act`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 617 chars

### `games/us-history-units/10 - Civil Rights Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 644 chars · sample: `Brown v. Board of Education (1954), decided unanimously 9-0 by the Warren Court,`
  * cat[0].clue[1] (value 200) — 629 chars · sample: `In September 1957, nine Black students enrolled at Little Rock Central High Scho`
  * cat[0].clue[2] (value 300) — 559 chars · sample: `Jim Crow laws were state and local statutes enacted across the South from the 18`
  * cat[0].clue[4] (value 500) — 608 chars · sample: `De facto segregation (Latin: 'by fact') is racial separation that exists in prac`
  * cat[1].clue[0] (value 100) — 564 chars · sample: `The Montgomery Bus Boycott (December 5, 1955 – December 20, 1956) began when Ros`
  * cat[1].clue[1] (value 200) — 555 chars · sample: `The sit-in movement began February 1, 1960 when four Black Greensboro, NC colleg`
  * cat[1].clue[2] (value 300) — 640 chars · sample: `Freedom Riders were interracial groups of civil rights activists (organized by C`
  * cat[1].clue[3] (value 400) — 633 chars · sample: `The Birmingham Campaign (April–May 1963), organized by the SCLC under King's lea`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 618 chars

### `games/us-history-units/11 - Modern Era Jeopardy Review.html` — 24 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 602 chars · sample: `Supply-side economics — also called 'Reaganomics' or 'trickle-down economics' — `
  * cat[0].clue[1] (value 200) — 570 chars · sample: `Barack Obama, elected as the 44th president on November 4, 2008, became the firs`
  * cat[0].clue[2] (value 300) — 614 chars · sample: `The Watergate scandal began with the June 17, 1972 break-in at the Democratic Na`
  * cat[0].clue[3] (value 400) — 570 chars · sample: `The Persian Gulf War (August 1990 – February 1991) was launched after Iraq's Sad`
  * cat[0].clue[4] (value 500) — 556 chars · sample: `The Cold War ended between 1989 and 1991: the Berlin Wall fell on November 9, 19`
  * cat[1].clue[0] (value 100) — 552 chars · sample: `Richard Nixon, the 37th president (1969–74), achieved historic diplomatic breakt`
  * cat[1].clue[2] (value 300) — 576 chars · sample: `The Iraq War (March 2003 – December 2011) was the U.S.-led invasion of Iraq base`
  * cat[1].clue[3] (value 400) — 613 chars · sample: `The Affordable Care Act (ACA, signed March 23, 2010) was the most significant ex`
  * ... and 15 more
* **final-explanation-too-verbose** (1)
  * final — 671 chars

### `games/grade-5-ela-practice/practice-exam.html` — 24 flag(s), 30 items audited

* **prompt-too-verbose** (20)
  * q[0] id=g5ela-001 — 519 chars (>300) · sample: `Read the passage, then answer the question.

"The Lost Compass"
Maya had hiked t`
  * q[1] id=g5ela-002 — 522 chars (>300) · sample: `Read the passage, then answer the question.

"The Lost Compass"
Maya had hiked t`
  * q[2] id=g5ela-003 — 520 chars (>300) · sample: `Read the passage, then answer the question.

"The Lost Compass"
Maya had hiked t`
  * q[3] id=g5ela-004 — 548 chars (>300) · sample: `Read the passage, then answer the question.

"The Lost Compass"
Maya had hiked t`
  * q[4] id=g5ela-005 — 545 chars (>300) · sample: `Read the passage, then answer the question.

"The Lost Compass"
Maya had hiked t`
  * q[5] id=g5ela-006 — 555 chars (>300) · sample: `Read the fable, then answer the question.

"The Ant and the Grasshopper" (a rete`
  * q[6] id=g5ela-007 — 565 chars (>300) · sample: `Read the fable, then answer the question.

"The Ant and the Grasshopper" (a rete`
  * q[7] id=g5ela-008 — 651 chars (>300) · sample: `Read the fable, then answer the question.

"The Ant and the Grasshopper" (a rete`
  * ... and 12 more
* **prompt-missing-end-punct** (3)
  * q[12] id=g5ela-013 · sample: `he word "pollination" MOST NEARLY means:`
  * q[18] id=g5ela-019 · sample: `sage, the word "damp" MOST NEARLY means:`
  * q[29] id=g5ela-030 · sample: `oon" is an idiom that MOST NEARLY means:`
* **explanation-missing-end-punct** (1)
  * q[15] id=g5ela-016 · sample: ` process — that is, to teach a 'how to.'`

### `games/grade-6-ela-practice/practice-exam.html` — 24 flag(s), 30 items audited

* **prompt-too-verbose** (20)
  * q[0] id=g6ela-001 — 684 chars (>300) · sample: `The Lighthouse Keeper's Daughter

Mira had counted the same forty-seven steps to`
  * q[1] id=g6ela-002 — 694 chars (>300) · sample: `The Lighthouse Keeper's Daughter

Mira had counted the same forty-seven steps to`
  * q[2] id=g6ela-003 — 769 chars (>300) · sample: `The Lighthouse Keeper's Daughter

Mira had counted the same forty-seven steps to`
  * q[3] id=g6ela-004 — 731 chars (>300) · sample: `The Lighthouse Keeper's Daughter

Mira had counted the same forty-seven steps to`
  * q[4] id=g6ela-005 — 675 chars (>300) · sample: `The Lighthouse Keeper's Daughter

Mira had counted the same forty-seven steps to`
  * q[5] id=g6ela-006 — 672 chars (>300) · sample: `The Race at Coyote Ridge

Diego had trained for the Coyote Ridge cross-country m`
  * q[6] id=g6ela-007 — 689 chars (>300) · sample: `The Race at Coyote Ridge

Diego had trained for the Coyote Ridge cross-country m`
  * q[7] id=g6ela-008 — 732 chars (>300) · sample: `The Race at Coyote Ridge

Diego had trained for the Coyote Ridge cross-country m`
  * ... and 12 more
* **explanation-missing-end-punct** (2)
  * q[7] id=g6ela-008 · sample: `kly and quietly — using the word 'like.'`
  * q[21] id=g6ela-022 · sample: `ar subject takes the singular verb 'is.'`
* **prompt-missing-end-punct** (2)
  * q[14] id=g6ela-015 · sample: `e word 'concentrate' MOST NEARLY means —`
  * q[19] id=g6ela-020 · sample: `he word 'digitizing' MOST NEARLY means —`

### `games/regents-us-history/practice-exam.html` — 24 flag(s), 40 items audited

* **prompt-missing-end-punct** (24)
  * q[3] id=us11-004 · sample: ` without representation' because the act`
  * q[4] id=us11-005 · sample: `he governed was most directly drawn from`
  * q[6] id=us11-007 · sample: `ispute between large and small states by`
  * q[7] id=us11-008 · sample: ` precedent that the United States should`
  * q[12] id=us11-013 · sample: `1863 Emancipation Proclamation primarily`
  * q[13] id=us11-014 · sample: `ments collectively are best described as`
  * q[14] id=us11-015 · sample: `d a Louisiana railcar law by ruling that`
  * q[15] id=us11-016 · sample: ` 'robber barons' by critics because they`
  * ... and 16 more

### `games/ap-biology/01 - Chemistry of Life Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 611 chars · sample: `Hydrogen bonds form between the partially positive H of one water molecule and t`
  * cat[0].clue[1] (value 200) — 550 chars · sample: `Surface tension arises because water molecules at the air-water interface H-bond`
  * cat[0].clue[2] (value 300) — 595 chars · sample: `Peptide bonds (C-N amide linkage) form during translation on the ribosome's pept`
  * cat[0].clue[4] (value 500) — 538 chars · sample: `Liquid water reaches maximum density at 3.98°C (1.000 g/mL); below this, H-bonds`
  * cat[1].clue[0] (value 100) — 570 chars · sample: `2'-deoxyribose is the 5-carbon sugar in DNA; removing the 2' -OH makes DNA chemi`
  * cat[1].clue[2] (value 300) — 534 chars · sample: `A buffer is a weak acid/conjugate base pair (e.g., H2CO3/HCO3-, H2PO4-/HPO4^2-) `
  * cat[1].clue[3] (value 400) — 587 chars · sample: `Starch comes in two forms: amylose (unbranched α-1,4 helix) and amylopectin (α-1`
  * cat[1].clue[4] (value 500) — 550 chars · sample: `Meselson and Stahl (1958) grew E. coli on 15N-NH4Cl (heavy nitrogen), shifted to`
  * ... and 15 more

### `games/ap-chemistry/06 - Thermodynamics Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[0] (value 100) — 540 chars · sample: `Enthalpy (H) is a state function: H = U + PV. At constant pressure, the change Δ`
  * cat[0].clue[1] (value 200) — 541 chars · sample: `Standard enthalpy of formation (ΔH°_f) is the enthalpy change to make 1 mol of a`
  * cat[0].clue[2] (value 300) — 567 chars · sample: `Bond breaking is always endothermic (ΔH > 0); bond formation is always exothermi`
  * cat[0].clue[3] (value 400) — 524 chars · sample: `ΔH ≈ Σ(bond enthalpies broken) − Σ(bond enthalpies formed). This averaged-bond-e`
  * cat[1].clue[0] (value 100) — 579 chars · sample: `Germain Hess formulated his law of constant heat summation in 1840: the enthalpy`
  * cat[1].clue[1] (value 200) — 575 chars · sample: `A state function depends only on the current state of a system (T, P, n, composi`
  * cat[1].clue[2] (value 300) — 593 chars · sample: `Reversing a chemical equation reverses the sign of its ΔH: A → B has ΔH = x kJ/m`
  * cat[1].clue[3] (value 400) — 557 chars · sample: `ΔH°_rxn = Σν·ΔH°_f(products) − Σν·ΔH°_f(reactants), where ν is the stoichiometri`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 507 chars

### `games/ap-chemistry/08 - Acids and Bases Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[0] (value 100) — 542 chars · sample: `Søren Sørensen introduced pH in 1909 as pH = −log[H⁺] (or more precisely, −log a`
  * cat[0].clue[4] (value 500) — 576 chars · sample: `Percent ionization of a weak acid = ([H⁺]_eq / [HA]_0) × 100%. Using the small-x`
  * cat[1].clue[0] (value 100) — 504 chars · sample: `The six common strong acids: HCl, HBr, HI (hydrohalic acids except HF, which is `
  * cat[1].clue[1] (value 200) — 585 chars · sample: `A buffer is a solution that resists pH change when small amounts of strong acid `
  * cat[1].clue[2] (value 300) — 548 chars · sample: `Common strong bases: Group 1 hydroxides (LiOH, NaOH, KOH, RbOH, CsOH) and the he`
  * cat[1].clue[3] (value 400) — 554 chars · sample: `Weak acids have Ka < 1 (often << 1) and ionize only partially in water. Common e`
  * cat[1].clue[4] (value 500) — 581 chars · sample: `The stronger the acid, the weaker its conjugate base (and vice versa). For stron`
  * cat[2].clue[0] (value 100) — 538 chars · sample: `The Henderson-Hasselbalch equation pH = pKa + log([A⁻]/[HA]) — derived from Ka =`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 570 chars

### `games/ap-chemistry/09 - Applications of Thermodynamics Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[1] (value 200) — 568 chars · sample: `Standard state in chemistry: solutes at 1 M concentration, gases at 1 atm partia`
  * cat[0].clue[2] (value 300) — 531 chars · sample: `The activity series ranks metals by reducing strength (top = strongest reducer).`
  * cat[0].clue[3] (value 400) — 562 chars · sample: `ΔG° = −nFE°_cell relates standard cell potential to standard Gibbs energy. Here `
  * cat[0].clue[4] (value 500) — 526 chars · sample: `ΔG = ΔG° + RT ln Q = RT ln(Q/K). So ΔG < 0 (spontaneous forward) ↔ Q < K (reacti`
  * cat[1].clue[0] (value 100) — 610 chars · sample: `A galvanic (or voltaic) cell exploits a spontaneous redox reaction to generate e`
  * cat[1].clue[1] (value 200) — 558 chars · sample: `The anode is the electrode where oxidation occurs ('AN OX' mnemonic). In a galva`
  * cat[1].clue[2] (value 300) — 504 chars · sample: `The cathode is the electrode where reduction occurs ('RED CAT' mnemonic). In a g`
  * cat[1].clue[3] (value 400) — 619 chars · sample: `Nernst: E = E° − (0.0592/n) log Q. Increasing [products] raises Q above 1 (log Q`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 546 chars

### `games/ap-computer-science-a/03 - Booleans and If Statements Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-terse** (23)
  * cat[0].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 3.`
  * cat[0].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 3.`
  * cat[0].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 3.`
  * cat[0].clue[4] (value 500) — 14 chars · sample: `AP CSA Unit 3.`
  * cat[1].clue[0] (value 100) — 14 chars · sample: `AP CSA Unit 3.`
  * cat[1].clue[1] (value 200) — 14 chars · sample: `AP CSA Unit 3.`
  * cat[1].clue[2] (value 300) — 14 chars · sample: `AP CSA Unit 3.`
  * cat[1].clue[3] (value 400) — 14 chars · sample: `AP CSA Unit 3.`
  * ... and 15 more

### `games/ap-european-history/04 - Unit 4 Scientific, Philosophical, and Political Developments Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (23)
  * cat[0].clue[0] (value 100) — 509 chars · sample: `Nicolaus Copernicus (1473-1543), a Polish canon, proposed in De revolutionibus o`
  * cat[0].clue[1] (value 200) — 532 chars · sample: `The Scientific Revolution (~1543-1687) replaced Aristotelian natural philosophy `
  * cat[0].clue[2] (value 300) — 527 chars · sample: `Galileo Galilei (1564-1642) used the telescope to observe Jupiter's moons, sunsp`
  * cat[0].clue[3] (value 400) — 523 chars · sample: `Isaac Newton (1643-1727) synthesized the Scientific Revolution in Principia Math`
  * cat[1].clue[0] (value 100) — 532 chars · sample: `John Locke (1632-1704) argued in Two Treatises of Government (1689) that people `
  * cat[1].clue[1] (value 200) — 512 chars · sample: `Charles-Louis de Secondat, Baron de Montesquieu, published The Spirit of the Law`
  * cat[1].clue[2] (value 300) — 542 chars · sample: `Jean-Jacques Rousseau (1712-1778) argued in The Social Contract (1762) that legi`
  * cat[1].clue[3] (value 400) — 542 chars · sample: `Voltaire (Francois-Marie Arouet, 1694-1778) was the Enlightenment's most influen`
  * ... and 15 more

### `games/ap-european-history/06 - Unit 6 Industrialization and Its Effects Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[0] (value 100) — 532 chars · sample: `The Industrial Revolution (~1760-1850), beginning in Britain, transformed produc`
  * cat[0].clue[1] (value 200) — 507 chars · sample: `Britain's Industrial Revolution created a new urban working class concentrated i`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `James Watt's improved steam engine (1769, condensing chamber patent) made steam `
  * cat[0].clue[3] (value 400) — 543 chars · sample: `The textile industry — especially cotton — was the engine of Britain's Industria`
  * cat[0].clue[4] (value 500) — 545 chars · sample: `The proletariat — Marx and Engels's term from the Communist Manifesto (1848) for`
  * cat[1].clue[0] (value 100) — 556 chars · sample: `Marxism, developed by Karl Marx (1818-1883) and Friedrich Engels, analyzed histo`
  * cat[1].clue[1] (value 200) — 540 chars · sample: `Class consciousness — Marx's term for workers' awareness of their shared economi`
  * cat[1].clue[2] (value 300) — 535 chars · sample: `Laissez-faire ('let it be') economics, theorized by Adam Smith in Wealth of Nati`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 582 chars

### `games/ap-macroeconomics/99 - Cumulative Yearlong Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[1] (value 200) — 562 chars · sample: `Economic growth is a sustained increase in real GDP (or real GDP per capita) ove`
  * cat[0].clue[2] (value 300) — 583 chars · sample: `Productivity is output per unit of input — most commonly labor productivity (GDP`
  * cat[0].clue[3] (value 400) — 609 chars · sample: `Human capital is the stock of productive knowledge, skills, health, and capabili`
  * cat[0].clue[4] (value 500) — 508 chars · sample: `Comparative advantage belongs to whoever can produce a good at the lowest opport`
  * cat[1].clue[1] (value 200) — 585 chars · sample: `GDP is the market value of all final goods and services produced within a countr`
  * cat[1].clue[2] (value 300) — 562 chars · sample: `The current account (CA) records a country's trade in goods and services, net in`
  * cat[1].clue[3] (value 400) — 545 chars · sample: `Short-run aggregate supply (SRAS) shows the positive relationship between the pr`
  * cat[1].clue[4] (value 500) — 512 chars · sample: `Absolute advantage means producing more output with the same inputs — or the sam`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 554 chars

### `games/ap-spanish-literature/99 - AP Spanish Literature Cumulative Yearlong Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[0] (value 100) — 647 chars · sample: `Sor Juana Inés de la Cruz (1648-1695) wrote the AP Spanish Literature required H`
  * cat[0].clue[1] (value 200) — 525 chars · sample: `Jorge Luis Borges (1899-1986) wrote AP Spanish Literature required El Sur and Bo`
  * cat[0].clue[2] (value 300) — 638 chars · sample: `La casa de Bernarda Alba (1936) is Federico García Lorca's AP Spanish Literature`
  * cat[0].clue[3] (value 400) — 525 chars · sample: `La elipsis dramática is the AP Spanish Literature technique of withholding key e`
  * cat[0].clue[4] (value 500) — 557 chars · sample: `Gabriel García Márquez (1927-2014) wrote AP Spanish Literature required La siest`
  * cat[1].clue[0] (value 100) — 579 chars · sample: `Análisis de texto on the AP Spanish Literature exam (Section I Part A) presents `
  * cat[1].clue[2] (value 300) — 532 chars · sample: `Fuenteovejuna (~1614) by Lope de Vega is AP Spanish Literature required Golden A`
  * cat[1].clue[3] (value 400) — 541 chars · sample: `San Manuel Bueno, mártir (1931) is Miguel de Unamuno's AP Spanish Literature req`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 831 chars

### `games/global-10-units/06 - Cold War 1945-1991 Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[1] (value 200) — 559 chars · sample: `Soviet satellite nations — including Poland, Hungary, Czechoslovakia, Romania, B`
  * cat[0].clue[4] (value 500) — 522 chars · sample: `The Warsaw Pact, signed May 14, 1955 by the Soviet Union and seven Eastern Europ`
  * cat[1].clue[0] (value 100) — 561 chars · sample: `Beginning June 24, 1948, the Soviet Union sealed all land and water routes into `
  * cat[1].clue[1] (value 200) — 528 chars · sample: `Announced March 12, 1947 in a speech to Congress requesting $400 million for Gre`
  * cat[1].clue[2] (value 300) — 563 chars · sample: `Secretary of State George Marshall unveiled the European Recovery Program (Marsh`
  * cat[1].clue[3] (value 400) — 543 chars · sample: `Containment, articulated by diplomat George Kennan in his 1946 'Long Telegram' a`
  * cat[1].clue[4] (value 500) — 549 chars · sample: `Superpowers refers to the United States and Soviet Union, whose nuclear arsenals`
  * cat[2].clue[0] (value 100) — 507 chars · sample: `A proxy war is a conflict in which two rival powers — chiefly the United States `
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 566 chars

### `games/us-history-units/06 - Imperialism, Progressivism, and World War I Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[0] (value 100) — 541 chars · sample: `The Spanish-American War (April–August 1898), sparked by the explosion of the US`
  * cat[0].clue[1] (value 200) — 592 chars · sample: `Yellow journalism — sensationalized, exaggerated news coverage designed to sell `
  * cat[0].clue[3] (value 400) — 586 chars · sample: `After the U.S. acquired the Philippines from Spain (1898), Filipino independence`
  * cat[0].clue[4] (value 500) — 578 chars · sample: `The Panama Canal, completed in 1914 after the U.S. supported Panama's independen`
  * cat[1].clue[0] (value 100) — 543 chars · sample: `The Roosevelt Corollary (1904) was Theodore Roosevelt's addition to the Monroe D`
  * cat[1].clue[1] (value 200) — 549 chars · sample: `The Open Door Policy, articulated in Secretary of State John Hay's notes to Euro`
  * cat[1].clue[2] (value 300) — 571 chars · sample: `The Platt Amendment (1901), attached as a condition to Cuba's new constitution, `
  * cat[1].clue[3] (value 400) — 511 chars · sample: `Dollar diplomacy was President William Howard Taft's foreign policy (1909–13) of`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 576 chars

### `games/us-history-units/08 - World War II Jeopardy Review.html` — 23 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[0] (value 100) — 618 chars · sample: `The Neutrality Acts (1935–37) prohibited the U.S. from selling arms or making lo`
  * cat[0].clue[2] (value 300) — 512 chars · sample: `Japan's surprise attack on the U.S. naval base at Pearl Harbor, Hawaii on Decemb`
  * cat[0].clue[3] (value 400) — 605 chars · sample: `Rosie the Riveter was the cultural icon of the WWII home front, representing the`
  * cat[0].clue[4] (value 500) — 564 chars · sample: `In Korematsu v. United States (1944), the Supreme Court ruled 6-3 that the force`
  * cat[1].clue[0] (value 100) — 512 chars · sample: `D-Day (June 6, 1944) — Operation Overlord — was the largest seaborne invasion in`
  * cat[1].clue[3] (value 400) — 590 chars · sample: `The Manhattan Project was the top-secret U.S. program (1942–45), employing 130,0`
  * cat[1].clue[4] (value 500) — 530 chars · sample: `On August 6, 1945, the U.S. dropped the uranium bomb 'Little Boy' on Hiroshima, `
  * cat[2].clue[0] (value 100) — 564 chars · sample: `The United Nations, established by the UN Charter signed June 26, 1945 by 50 nat`
  * ... and 14 more
* **final-explanation-too-verbose** (1)
  * final — 611 chars

### `games/ap-chemistry/07 - Equilibrium Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-verbose** (21)
  * cat[0].clue[0] (value 100) — 591 chars · sample: `Kc is the equilibrium constant written in terms of molar concentrations: for aA `
  * cat[0].clue[2] (value 300) — 517 chars · sample: `Kp uses partial pressures (typically in atm) for gases: aA(g) + bB(g) ⇌ cC(g) + `
  * cat[0].clue[4] (value 500) — 564 chars · sample: `At equilibrium, forward rate = reverse rate. For an elementary reaction A ⇌ B: k`
  * cat[1].clue[0] (value 100) — 561 chars · sample: `An ICE table organizes equilibrium concentrations by row: Initial (starting conc`
  * cat[1].clue[1] (value 200) — 501 chars · sample: `For 2 A ⇌ B, the stoichiometry says 2 moles of A are consumed for every 1 mole o`
  * cat[1].clue[2] (value 300) — 577 chars · sample: `When K is very small (K < ~10⁻⁴ for an initial concentration ~0.1 M), the change`
  * cat[1].clue[3] (value 400) — 545 chars · sample: `When the small-x approximation fails (K not small enough), the K expression yiel`
  * cat[1].clue[4] (value 500) — 554 chars · sample: `K is a function of EQUILIBRIUM concentrations, not initial. The E row of the ICE`
  * ... and 13 more
* **final-explanation-too-verbose** (1)
  * final — 510 chars

### `games/ap-comparative-government/03 - Political Culture and Participation Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-terse** (22)
  * cat[0].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * cat[0].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * cat[0].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * cat[1].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * cat[1].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * cat[1].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * cat[1].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * cat[1].clue[4] (value 500) — 19 chars · sample: `AP Comp Gov Unit 3.`
  * ... and 14 more

### `games/ap-german-language/04 - Science and Technology Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-terse** (21)
  * cat[0].clue[0] (value 100) — 17 chars · sample: `AP German Unit 4.`
  * cat[0].clue[1] (value 200) — 17 chars · sample: `AP German Unit 4.`
  * cat[0].clue[2] (value 300) — 17 chars · sample: `AP German Unit 4.`
  * cat[0].clue[3] (value 400) — 17 chars · sample: `AP German Unit 4.`
  * cat[1].clue[1] (value 200) — 17 chars · sample: `AP German Unit 4.`
  * cat[1].clue[4] (value 500) — 17 chars · sample: `AP German Unit 4.`
  * cat[2].clue[0] (value 100) — 17 chars · sample: `AP German Unit 4.`
  * cat[2].clue[1] (value 200) — 17 chars · sample: `AP German Unit 4.`
  * ... and 13 more
* **final-explanation-too-terse** (1)
  * final — 17 chars

### `games/ap-german-language/06 - Global Challenges Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-terse** (21)
  * cat[0].clue[2] (value 300) — 17 chars · sample: `AP German Unit 6.`
  * cat[0].clue[3] (value 400) — 17 chars · sample: `AP German Unit 6.`
  * cat[1].clue[0] (value 100) — 17 chars · sample: `AP German Unit 6.`
  * cat[1].clue[1] (value 200) — 17 chars · sample: `AP German Unit 6.`
  * cat[1].clue[2] (value 300) — 17 chars · sample: `AP German Unit 6.`
  * cat[1].clue[3] (value 400) — 17 chars · sample: `AP German Unit 6.`
  * cat[1].clue[4] (value 500) — 17 chars · sample: `AP German Unit 6.`
  * cat[2].clue[0] (value 100) — 17 chars · sample: `AP German Unit 6.`
  * ... and 13 more
* **final-explanation-too-terse** (1)
  * final — 17 chars

### `games/ap-music-theory/99 - Cumulative Yearlong Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-verbose** (20)
  * cat[0].clue[0] (value 100) — 528 chars · sample: `Octave: 12 half steps (semitones). Frequency ratio 2:1 (e.g., A440 to A880). Pit`
  * cat[0].clue[1] (value 200) — 514 chars · sample: `IV: subdominant or pre-dominant function. Built on scale degree 4. Prepares V. I`
  * cat[0].clue[2] (value 300) — 540 chars · sample: `B major: 5 sharps - F♯, C♯, G♯, D♯, A♯. To find: order of sharps F#C#G#D#A#E#B# `
  * cat[0].clue[4] (value 500) — 514 chars · sample: `D Dorian: D-E-F-G-A-B-C-D (white keys starting on D). Differs from D natural min`
  * cat[1].clue[0] (value 100) — 529 chars · sample: `Perfect Authentic Cadence (PAC): V-I (or V7-I) where both chords in root positio`
  * cat[1].clue[1] (value 200) — 571 chars · sample: `Phrygian half cadence: iv6 to V in minor key. Bass descends by half step: F to E`
  * cat[1].clue[2] (value 300) — 615 chars · sample: `Wagner (1813-1883): German Romantic composer. Tristan und Isolde (1859, premiere`
  * cat[1].clue[3] (value 400) — 565 chars · sample: `Parallel 3rds and 6ths: permitted (and beautiful) in tonal music. Imperfect cons`
  * ... and 12 more
* **clue-too-terse** (1)
  * cat[3].clue[1] (value 200) — 11 chars · sample: `Form A-B-A.`
* **final-explanation-too-verbose** (1)
  * final — 643 chars

### `games/ap-physics-1/05 - Torque and Rotational Dynamics Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-verbose** (21)
  * cat[0].clue[0] (value 100) — 560 chars · sample: `Angular velocity omega = d(theta)/dt (rad/s), the rotational analog of linear ve`
  * cat[0].clue[1] (value 200) — 553 chars · sample: `Angular acceleration alpha = d(omega)/dt (rad/s^2), the rotational analog of lin`
  * cat[0].clue[2] (value 300) — 539 chars · sample: `Angular velocity unit: rad/s (radians per second). Radians are dimensionless (ar`
  * cat[0].clue[3] (value 400) — 575 chars · sample: `v = r omega (m/s), tangential linear velocity of a point at radius r on a rotati`
  * cat[1].clue[0] (value 100) — 603 chars · sample: `Torque tau (N * m) is the rotational analog of force — what causes angular accel`
  * cat[1].clue[1] (value 200) — 568 chars · sample: `tau = r F sin(theta) (N * m), where r is the distance from pivot to force applic`
  * cat[1].clue[2] (value 300) — 611 chars · sample: `Maximum torque occurs when force is perpendicular to position vector (theta = 90`
  * cat[1].clue[3] (value 400) — 558 chars · sample: `Torque unit: N * m (newton-meter). Dimensionally same as energy (J = N * m), but`
  * ... and 13 more
* **final-explanation-too-verbose** (1)
  * final — 639 chars

### `games/ap-physics-c-em/05 - Magnetic Fields and Forces Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-verbose** (21)
  * cat[0].clue[0] (value 100) — 527 chars · sample: `The Lorentz force F = q*v x B is the magnetic force on a charge q moving with ve`
  * cat[0].clue[1] (value 200) — 524 chars · sample: `Lorentz force formula is F = q*v x B (vector form), with magnitude F = |q|*v*B*s`
  * cat[0].clue[2] (value 300) — 528 chars · sample: `The SI unit of magnetic field is the tesla (T), equal to 1 N/(A*m) or 1 kg/(A*s^`
  * cat[0].clue[3] (value 400) — 505 chars · sample: `Force on a current-carrying wire is F = I*L x B, where I is the current, L is th`
  * cat[0].clue[4] (value 500) — 586 chars · sample: `Magnetic force does no work on a moving charge: F_magnetic = qv x B is always pe`
  * cat[1].clue[0] (value 100) — 518 chars · sample: `Trajectory of a charged particle in a uniform B with velocity v perpendicular to`
  * cat[1].clue[2] (value 300) — 524 chars · sample: `Period of cyclotron motion is T = 2*pi*m/(q*B), the time for one full circular o`
  * cat[1].clue[3] (value 400) — 553 chars · sample: `Trajectory with a parallel velocity component (v has both perpendicular and para`
  * ... and 13 more
* **final-explanation-too-verbose** (1)
  * final — 996 chars

### `games/civics-pig/04 - Elections and Participation Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-verbose** (21)
  * cat[0].clue[1] (value 200) — 535 chars · sample: `The Voting Rights Act of 1965—signed by President Johnson in response to Bloody `
  * cat[0].clue[2] (value 300) — 532 chars · sample: `Lobbying is direct communication with legislators or executive officials to infl`
  * cat[0].clue[3] (value 400) — 506 chars · sample: `The 19th Amendment (ratified August 18, 1920) prohibits denying the right to vot`
  * cat[0].clue[4] (value 500) — 515 chars · sample: `A primary election is held before the general election to let party members (or `
  * cat[1].clue[1] (value 200) — 535 chars · sample: `A political party is an organized group that seeks to gain and exercise governme`
  * cat[1].clue[3] (value 400) — 516 chars · sample: `The 15th Amendment (1870) prohibits denying voting rights based on 'race, color,`
  * cat[1].clue[4] (value 500) — 551 chars · sample: `Gerrymandering is the manipulation of electoral district boundaries to give one `
  * cat[2].clue[0] (value 100) — 510 chars · sample: `Campaign finance law regulates the raising and spending of money in elections. T`
  * ... and 13 more
* **final-explanation-too-verbose** (1)
  * final — 547 chars

### `games/grade-5-science/02 - Earth's Systems Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-verbose** (21)
  * cat[0].clue[0] (value 100) — 552 chars · sample: `Evaporation happens when liquid water absorbs heat energy from the Sun and chang`
  * cat[0].clue[2] (value 300) — 524 chars · sample: `The atmosphere is the layer of gases surrounding Earth, made of about 78% nitrog`
  * cat[0].clue[3] (value 400) — 530 chars · sample: `Precipitation is any form of water that falls from clouds, including rain, snow,`
  * cat[0].clue[4] (value 500) — 560 chars · sample: `Runoff is rain or snowmelt that flows downhill across the surface, eventually re`
  * cat[1].clue[0] (value 100) — 510 chars · sample: `Weather is the day-to-day state of the atmosphere, including temperature, humidi`
  * cat[1].clue[1] (value 200) — 563 chars · sample: `Pollution is the release of harmful substances into the air, water, or soil. Com`
  * cat[1].clue[2] (value 300) — 526 chars · sample: `Climate is the long-term average of weather conditions in an area over 30 or mor`
  * cat[1].clue[3] (value 400) — 555 chars · sample: `Conservation means protecting and carefully using natural resources so they last`
  * ... and 13 more
* **final-explanation-too-verbose** (1)
  * final — 518 chars

### `games/grade-5-science/05 - Forces and Motion Jeopardy Review.html` — 22 flag(s), 26 items audited

* **explanation-too-verbose** (22)
  * cat[0].clue[0] (value 100) — 507 chars · sample: `Gravity is the invisible attractive force every object with mass exerts on every`
  * cat[0].clue[1] (value 200) — 543 chars · sample: `Earth's gravity always pulls toward the planet's center, which is why a person s`
  * cat[0].clue[3] (value 400) — 515 chars · sample: `Projectile motion is the curved path of any thrown or launched object as it move`
  * cat[0].clue[4] (value 500) — 509 chars · sample: `On the Moon, you would weigh about one-sixth (1/6) what you weigh on Earth becau`
  * cat[1].clue[0] (value 100) — 516 chars · sample: `A force is any push or pull that can change an object's motion: starting it, sto`
  * cat[1].clue[1] (value 200) — 529 chars · sample: `Balanced forces are equal-strength forces pulling or pushing in opposite directi`
  * cat[1].clue[2] (value 300) — 508 chars · sample: `Unbalanced forces happen when two opposing forces are not equal in size, so the `
  * cat[1].clue[3] (value 400) — 504 chars · sample: `Newton's First Law (law of inertia) says an object at rest stays at rest, and an`
  * ... and 14 more

### `games/ap-computer-science-principles/01 - Creative Development Jeopardy Review.html` — 21 flag(s), 26 items audited

* **explanation-too-verbose** (21)
  * cat[0].clue[0] (value 100) — 517 chars · sample: `The program design process moves through investigation (user needs, requirements`
  * cat[0].clue[1] (value 200) — 551 chars · sample: `An iteration cycle in AP CSP includes investigate, design, build, test, learn — `
  * cat[0].clue[2] (value 300) — 525 chars · sample: `Pseudocode is the AP CSP reference language — College Board publishes an officia`
  * cat[0].clue[3] (value 400) — 521 chars · sample: `Iterative development (popularized by agile manifesto, 2001, Snowbird Utah) repl`
  * cat[0].clue[4] (value 500) — 573 chars · sample: `Collaboration on AP CSP includes pair programming (Kent Beck's Extreme Programmi`
  * cat[1].clue[0] (value 100) — 553 chars · sample: `Comments are non-executable annotations (// in Java/JavaScript, # in Python) tha`
  * cat[1].clue[1] (value 200) — 507 chars · sample: `A procedure (PROCEDURE name(parameters) in AP CSP reference) packages reusable l`
  * cat[1].clue[2] (value 300) — 502 chars · sample: `Debugging gets its name from Grace Hopper's 1947 Harvard Mark II logbook — a mot`
  * ... and 13 more

### `games/ap-european-history/99 - Cumulative Yearlong Jeopardy Review.html` — 21 flag(s), 26 items audited

* **explanation-too-verbose** (20)
  * cat[0].clue[3] (value 400) — 536 chars · sample: `Northern Italy's fragmented geography produced independent city-states — Florenc`
  * cat[0].clue[4] (value 500) — 517 chars · sample: `The Protestant Reformation (1517-c.1648) fractured Western Christianity, spawnin`
  * cat[1].clue[0] (value 100) — 553 chars · sample: `Pre-1914 militarism described the glorification of military power and the Europe`
  * cat[1].clue[1] (value 200) — 545 chars · sample: `Absolutism describes the concentration of legislative, judicial, and executive p`
  * cat[1].clue[2] (value 300) — 501 chars · sample: `Italian unification (Risorgimento, 1848-1871) proceeded through stages: Cavour u`
  * cat[1].clue[4] (value 500) — 507 chars · sample: `Louis XIV transformed a hunting lodge at Versailles into Europe's grandest palac`
  * cat[2].clue[0] (value 100) — 536 chars · sample: `The Scientific Revolution (~1543-1687) replaced Aristotelian natural philosophy `
  * cat[2].clue[1] (value 200) — 522 chars · sample: `The French Revolution (1789-1799) dismantled the Old Regime's hierarchy, produci`
  * ... and 12 more
* **final-explanation-too-verbose** (1)
  * final — 560 chars

### `games/ap-german-language/03 - Beauty and Aesthetics Jeopardy Review.html` — 21 flag(s), 26 items audited

* **explanation-too-terse** (21)
  * cat[0].clue[1] (value 200) — 17 chars · sample: `AP German Unit 3.`
  * cat[0].clue[2] (value 300) — 17 chars · sample: `AP German Unit 3.`
  * cat[0].clue[3] (value 400) — 17 chars · sample: `AP German Unit 3.`
  * cat[0].clue[4] (value 500) — 17 chars · sample: `AP German Unit 3.`
  * cat[1].clue[0] (value 100) — 17 chars · sample: `AP German Unit 3.`
  * cat[1].clue[2] (value 300) — 17 chars · sample: `AP German Unit 3.`
  * cat[1].clue[3] (value 400) — 17 chars · sample: `AP German Unit 3.`
  * cat[1].clue[4] (value 500) — 17 chars · sample: `AP German Unit 3.`
  * ... and 13 more

### `games/ap-music-theory/02 - Music Fundamentals II Jeopardy Review.html` — 21 flag(s), 26 items audited

* **explanation-too-verbose** (20)
  * cat[0].clue[0] (value 100) — 516 chars · sample: `A minor: relative minor of C major - shares the same key signature (no sharps/fl`
  * cat[0].clue[1] (value 200) — 550 chars · sample: `Harmonic minor: raise the 7th scale degree by half step. A harmonic minor: A-B-C`
  * cat[0].clue[2] (value 300) — 527 chars · sample: `Melodic minor: ascending raises BOTH 6th and 7th (A melodic ascending: A-B-C-D-E`
  * cat[0].clue[4] (value 500) — 568 chars · sample: `Aeolian mode: 6th mode of major (white keys A to A). A-B-C-D-E-F-G-A = natural m`
  * cat[1].clue[0] (value 100) — 535 chars · sample: `Triad qualities in major key (Roman numerals): I (major), ii (minor), iii (minor`
  * cat[1].clue[1] (value 200) — 519 chars · sample: `Major triad construction: root + M3 (4 half steps) + P5 (7 half steps from root)`
  * cat[1].clue[2] (value 300) — 523 chars · sample: `Phrygian mode: E-F-G-A-B-C-D-E (white keys on E). Compared to E minor: LOWERED 2`
  * cat[1].clue[3] (value 400) — 509 chars · sample: `Diminished triad: m3 + m3 (root to 3rd is m3, 3rd to 5th is m3, root to 5th is d`
  * ... and 12 more
* **final-explanation-too-verbose** (1)
  * final — 591 chars

### `games/ap-physics-1/01 - Kinematics Jeopardy Review.html` — 21 flag(s), 26 items audited

* **explanation-too-verbose** (20)
  * cat[0].clue[0] (value 100) — 596 chars · sample: `Velocity is a vector: v = Delta x / Delta t (m/s) with both magnitude and direct`
  * cat[0].clue[1] (value 200) — 524 chars · sample: `Acceleration is a vector: a = Delta v / Delta t (m/s^2). Galileo's free-fall exp`
  * cat[1].clue[0] (value 100) — 550 chars · sample: `A projectile undergoes 2D motion with the ONLY force being gravity (air resistan`
  * cat[1].clue[2] (value 300) — 510 chars · sample: `v_x = v_0 cos(theta) stays constant throughout flight because no horizontal forc`
  * cat[1].clue[4] (value 500) — 516 chars · sample: `Range R = v_0^2 sin(2 theta) / g (meters), valid only for level ground (launch h`
  * cat[2].clue[0] (value 100) — 550 chars · sample: `A vector has both magnitude and direction. Position, velocity, acceleration, for`
  * cat[2].clue[1] (value 200) — 527 chars · sample: `A scalar has magnitude but no direction. Time, mass, distance, speed, energy, wo`
  * cat[2].clue[2] (value 300) — 555 chars · sample: `Components: A_x = A cos(theta), A_y = A sin(theta), where theta is measured from`
  * ... and 12 more
* **final-explanation-too-verbose** (1)
  * final — 604 chars

### `games/ap-physics-c-em/01 - Electrostatics Jeopardy Review.html` — 21 flag(s), 26 items audited

* **explanation-too-verbose** (20)
  * cat[0].clue[0] (value 100) — 725 chars · sample: `Coulomb's law gives the electrostatic force between two point charges as F = k*q`
  * cat[0].clue[1] (value 200) — 535 chars · sample: `Coulomb's law formula is F = k*q_1*q_2/r^2, where k = 1/(4*pi*epsilon_0) ≈ 8.99 `
  * cat[0].clue[2] (value 300) — 592 chars · sample: `Coulomb's constant k = 8.99 x 10^9 N*m^2/C^2 (sometimes rounded to 9 x 10^9). Eq`
  * cat[0].clue[3] (value 400) — 597 chars · sample: `Like charges repel: two positive charges (or two negative) push each other apart`
  * cat[0].clue[4] (value 500) — 611 chars · sample: `Unlike charges attract: a positive and a negative charge pull each other togethe`
  * cat[1].clue[0] (value 100) — 620 chars · sample: `Electric field E is the force per unit charge experienced by a test charge q_tes`
  * cat[1].clue[1] (value 200) — 563 chars · sample: `Electric field from a point charge Q at distance r is E = k*Q/r^2 = Q/(4*pi*epsi`
  * cat[1].clue[2] (value 300) — 567 chars · sample: `The SI unit of electric field is newton per coulomb (N/C), equivalent to volt pe`
  * ... and 12 more
* **final-explanation-too-verbose** (1)
  * final — 932 chars

### `games/us-history-units/04 - Civil War and Reconstruction Jeopardy Review.html` — 21 flag(s), 26 items audited

* **explanation-too-verbose** (20)
  * cat[0].clue[0] (value 100) — 505 chars · sample: `Secession — the withdrawal of Southern states from the Union — began when South `
  * cat[0].clue[1] (value 200) — 517 chars · sample: `The Confederate States of America, formed in February 1861 by eleven seceding st`
  * cat[0].clue[2] (value 300) — 535 chars · sample: `The Union — the Northern states loyal to the federal government — fought the Civ`
  * cat[1].clue[0] (value 100) — 513 chars · sample: `General Winfield Scott's Anaconda Plan (1861) proposed strangling the Confederac`
  * cat[1].clue[2] (value 300) — 561 chars · sample: `The Battle of Gettysburg (July 1–3, 1863) was the bloodiest battle of the Civil `
  * cat[1].clue[3] (value 400) — 513 chars · sample: `The Siege and Fall of Vicksburg (May–July 4, 1863) gave the Union control of the`
  * cat[1].clue[4] (value 500) — 546 chars · sample: `General William T. Sherman's March to the Sea (November–December 1864) cut a 60-`
  * cat[2].clue[0] (value 100) — 569 chars · sample: `Abraham Lincoln, the 16th President (1861–65), guided the Union through the Civi`
  * ... and 12 more
* **final-explanation-too-verbose** (1)
  * final — 584 chars

### `games/ap-bio-practice/practice-exam.html` — 21 flag(s), 40 items audited

* **prompt-missing-end-punct** (19)
  * q[2] id=apbio-003 · sample: `cellulose. The best explanation is that:`
  * q[3] id=apbio-004 · sample: `s sharply. The best explanation is that:`
  * q[5] id=apbio-006 · sample: `he plasma membrane is best described as:`
  * q[6] id=apbio-007 · sample: `ter. This process is best classified as:`
  * q[9] id=apbio-010 · sample: `e Vmax. The best interpretation is that:`
  * q[11] id=apbio-012 · sample: `orylation, ATP synthase produces ATP by:`
  * q[12] id=apbio-013 · sample: `this water-splitting (photolysis) is to:`
  * q[14] id=apbio-015 · sample: `pose of this fermentation pathway is to:`
  * ... and 11 more
* **prompt-too-verbose** (1)
  * q[24] id=apbio-025 — 307 chars (>300) · sample: `A geneticist crosses two heterozygous plants and expects a 3:1 (yellow:green) ph`
* **choices-length-variance** (1)
  * q[37] id=apbio-038 — min=21, max=88, ratio=4.2

### `games/regents-ela/practice-exam.html` — 21 flag(s), 40 items audited

* **prompt-too-verbose** (10)
  * q[1] id=ela-002 — 347 chars (>300) · sample: `Read this passage:

'Maya had practiced the speech for weeks, but standing now a`
  * q[3] id=ela-004 — 388 chars (>300) · sample: `Read this passage:

'The town meeting had begun in shouts and ended in shouts, b`
  * q[5] id=ela-006 — 328 chars (>300) · sample: `Read this passage:

'Devon hated parties, but his sister had begged him to come.`
  * q[8] id=ela-009 — 304 chars (>300) · sample: `Read this passage:

'The hallway was narrow and the bulbs hummed like trapped wa`
  * q[15] id=ela-016 — 465 chars (>300) · sample: `Read this paragraph:

'Cities that invest in safe, separated bike lanes consiste`
  * q[19] id=ela-020 — 350 chars (>300) · sample: `Read this paragraph:

'Critics argue that homework consumes time better spent on`
  * q[20] id=ela-021 — 334 chars (>300) · sample: `Read this paragraph:

'When demand for cheap fast fashion soared in the 2000s, g`
  * q[21] id=ela-022 — 325 chars (>300) · sample: `Read this paragraph:

'Public libraries and bookstores both connect readers to b`
  * ... and 2 more
* **prompt-missing-end-punct** (7)
  * q[5] id=ela-006 · sample: `ng time.'

Devon is best described as a:`
  * q[6] id=ela-007 · sample: `ype of conflict driving this passage is:`
  * q[21] id=ela-022 · sample: `ue.'

This paragraph is organized using:`
  * q[24] id=ela-025 · sample: `t.'

The author's primary purpose is to:`
  * q[37] id=ela-038 · sample: `e, the word 'brusque' most nearly means:`
  * q[38] id=ela-039 · sample: `sentence, 'innocuous' most nearly means:`
  * q[39] id=ela-040 · sample: ` the word 'tentative' most nearly means:`
* **explanation-missing-end-punct** (4)
  * q[12] id=ela-013 · sample: `, and a simile would use 'like' or 'as.'`
  * q[28] id=ela-029 · sample: `ngular verb: 'has,' not 'have' or 'are.'`
  * q[29] id=ela-030 · sample: `al-register option here is 'his or her.'`
  * q[38] id=ela-039 · sample: ` and bland — the meaning of 'innocuous.'`

### `games/ap-comparative-government/02 - Political Institutions Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-terse** (20)
  * cat[0].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[0].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[0].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[0].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[0].clue[4] (value 500) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[1].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[1].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[1].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * ... and 12 more

### `games/ap-comparative-government/99 - Cumulative Yearlong Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-terse** (20)
  * cat[0].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[0].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[0].clue[4] (value 500) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[1].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[1].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[1].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[1].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * cat[1].clue[4] (value 500) — 19 chars · sample: `AP Comp Gov Unit 2.`
  * ... and 12 more

### `games/ap-macroeconomics/01 - Unit 1 Basic Economic Concepts Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-verbose** (19)
  * cat[0].clue[0] (value 100) — 523 chars · sample: `Demand is the schedule of quantities consumers are willing and able to buy at ea`
  * cat[0].clue[1] (value 200) — 547 chars · sample: `The circular flow model illustrates how households and firms interact in two mar`
  * cat[0].clue[2] (value 300) — 542 chars · sample: `Supply is the schedule of quantities producers are willing and able to sell at e`
  * cat[0].clue[3] (value 400) — 505 chars · sample: `A mixed economy combines private markets with government intervention. Markets a`
  * cat[0].clue[4] (value 500) — 504 chars · sample: `A trade-off is the situation in which gaining more of one good requires giving u`
  * cat[1].clue[1] (value 200) — 519 chars · sample: `Property rights are legal guarantees allowing owners to use, transfer, or exclud`
  * cat[1].clue[2] (value 300) — 533 chars · sample: `Efficiency means maximizing total output from available resources (the economy i`
  * cat[1].clue[3] (value 400) — 522 chars · sample: `The PPC (also PPF) plots maximum combinations of two goods an economy can produc`
  * ... and 11 more
* **final-explanation-too-verbose** (1)
  * final — 524 chars

### `games/chemistry-regents/01 - Atomic Concepts Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-verbose** (19)
  * cat[0].clue[0] (value 100) — 560 chars · sample: `The proton was identified by Ernest Rutherford in 1917 through experiments bomba`
  * cat[0].clue[1] (value 200) — 528 chars · sample: `James Chadwick discovered the neutron in 1932 by analyzing radiation emitted whe`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `J.J. Thomson discovered the electron in 1897 using cathode-ray tube experiments,`
  * cat[0].clue[3] (value 400) — 518 chars · sample: `Ernest Rutherford proposed the nuclear model in 1911 after his famous gold-foil `
  * cat[0].clue[4] (value 500) — 539 chars · sample: `The atomic number (Z) uniquely identifies an element—change Z and you change the`
  * cat[1].clue[4] (value 500) — 528 chars · sample: `Nuclide notation (also called isotopic notation) writes an isotope with mass num`
  * cat[2].clue[0] (value 100) — 528 chars · sample: `Electron configuration lists the number of electrons in each principal energy le`
  * cat[2].clue[1] (value 200) — 517 chars · sample: `Orbitals are three-dimensional regions defined by quantum mechanics where electr`
  * ... and 11 more
* **final-explanation-too-verbose** (1)
  * final — 586 chars

### `games/global-9/03 - Classical Civilizations Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-verbose** (19)
  * cat[0].clue[2] (value 300) — 515 chars · sample: `Athens (c. 5th century BCE) developed the world's first direct democracy under l`
  * cat[0].clue[3] (value 400) — 511 chars · sample: `The Peloponnesian War (431–404 BCE) was a catastrophic 27-year conflict between `
  * cat[1].clue[0] (value 100) — 553 chars · sample: `Pericles (495–429 BCE) was Athens's most powerful democratic leader, who expande`
  * cat[1].clue[1] (value 200) — 537 chars · sample: `The Maurya Empire (322–185 BCE) was India's first pan-subcontinent empire, found`
  * cat[1].clue[2] (value 300) — 562 chars · sample: `Direct democracy, practiced in Athens from around 508 BCE, gave every adult male`
  * cat[1].clue[3] (value 400) — 515 chars · sample: `Alexander the Great (356–323 BCE), king of Macedonia, conquered an empire stretc`
  * cat[1].clue[4] (value 500) — 601 chars · sample: `Hellenistic culture was the hybrid civilization that emerged after Alexander's c`
  * cat[2].clue[0] (value 100) — 519 chars · sample: `The Roman Republic (509–27 BCE) was Rome's system of government after expelling `
  * ... and 11 more
* **final-explanation-too-verbose** (1)
  * final — 575 chars

### `games/grade-5-math/02 - Multi-Digit Multiplication and Division Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-verbose** (18)
  * cat[0].clue[0] (value 100) — 509 chars · sample: `Worked example: 432 ÷ 6 using long division (5.NBT.B.6). Step 1: 6 goes into 43 `
  * cat[0].clue[1] (value 200) — 520 chars · sample: `Worked example: 528 ÷ 12 using long division (5.NBT.B.6). Step 1: 12 does not go`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `Worked example: estimate 824 ÷ 41 using compatible numbers (5.NBT.B.6). Pick num`
  * cat[0].clue[3] (value 400) — 555 chars · sample: `Worked example: 248 ÷ 12 with partial boxes counting (5.NBT.B.6). Standard divis`
  * cat[0].clue[4] (value 500) — 539 chars · sample: `Worked example: estimate 7,392 ÷ 92 with compatible numbers (5.NBT.B.6). Round 7`
  * cat[1].clue[1] (value 200) — 504 chars · sample: `Worked example: 23 x 4 using the standard algorithm (5.NBT.B.5). Multiply the on`
  * cat[1].clue[2] (value 300) — 566 chars · sample: `Worked example: 47 x 32 using the standard algorithm (5.NBT.B.5). Partial produc`
  * cat[1].clue[3] (value 400) — 537 chars · sample: `Worked example: area = length x width for a rectangle (5.NBT.B.5; also 5.MD.C.5)`
  * ... and 10 more
* **explanation-missing-end-punct** (1)
  * cat[4].clue[2] (value 300) · sample: `ays asking 'how many times does 24 fit?'`
* **final-explanation-too-verbose** (1)
  * final — 596 chars

### `games/grade-5-science/04 - Structure and Properties of Matter Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-verbose** (20)
  * cat[0].clue[2] (value 300) — 544 chars · sample: `A physical change is a change in shape, size, or state of matter where no new su`
  * cat[0].clue[3] (value 400) — 513 chars · sample: `A gas is a state of matter with no definite shape and no definite volume, expand`
  * cat[1].clue[0] (value 100) — 515 chars · sample: `Particles are the tiny units (atoms and molecules) that make up all matter and a`
  * cat[1].clue[1] (value 200) — 508 chars · sample: `A liquid is a state of matter with definite volume but no definite shape; it tak`
  * cat[1].clue[2] (value 300) — 527 chars · sample: `Volume is the amount of three-dimensional space an object takes up, measured in `
  * cat[1].clue[3] (value 400) — 515 chars · sample: `Evaporation is the change from liquid to gas that happens at a liquid's surface `
  * cat[1].clue[4] (value 500) — 564 chars · sample: `Filtration is a physical separation method that uses a porous material (paper, s`
  * cat[2].clue[0] (value 100) — 514 chars · sample: `A mixture is two or more substances physically combined without chemically bondi`
  * ... and 12 more

### `games/us-history-units/05 - Industrialization and the Gilded Age Jeopardy Review.html` — 20 flag(s), 26 items audited

* **explanation-too-verbose** (19)
  * cat[0].clue[0] (value 100) — 605 chars · sample: `Completed at Promontory Summit, Utah on May 10, 1869, the Transcontinental Railr`
  * cat[0].clue[1] (value 200) — 506 chars · sample: `The Bessemer process (patented 1856 by Henry Bessemer) allowed mass production o`
  * cat[0].clue[2] (value 300) — 602 chars · sample: `The corporation — a legal entity that can raise capital by selling shares of sto`
  * cat[0].clue[3] (value 400) — 502 chars · sample: `A monopoly is control of an entire industry or market by a single company, allow`
  * cat[0].clue[4] (value 500) — 580 chars · sample: `A trust was a legal arrangement in which shareholders of competing companies sur`
  * cat[1].clue[0] (value 100) — 587 chars · sample: `Andrew Carnegie (1835–1919), a Scottish immigrant, built Carnegie Steel into the`
  * cat[1].clue[4] (value 500) — 536 chars · sample: `Andrew Carnegie's 1889 essay 'The Gospel of Wealth' argued that great wealth cre`
  * cat[2].clue[0] (value 100) — 530 chars · sample: `The Knights of Labor (founded 1869), led by Terence Powderly, was the first majo`
  * ... and 11 more
* **final-explanation-too-verbose** (1)
  * final — 530 chars

### `games/ap-physics-c-em/03 - Electric Potential Jeopardy Review.html` — 19 flag(s), 26 items audited

* **explanation-too-verbose** (18)
  * cat[0].clue[0] (value 100) — 563 chars · sample: `Electric potential V at a point is the potential energy per unit charge: V = U/q`
  * cat[0].clue[1] (value 200) — 535 chars · sample: `The SI unit of electric potential is the volt (V), equal to one joule per coulom`
  * cat[0].clue[2] (value 300) — 508 chars · sample: `Electric potential at distance r from a point charge Q is V = k*Q/r = Q/(4*pi*ep`
  * cat[0].clue[3] (value 400) — 543 chars · sample: `Reference point for electric potential is conventionally taken at infinity (V = `
  * cat[0].clue[4] (value 500) — 571 chars · sample: `An equipotential surface is a surface of constant potential V (no work done movi`
  * cat[1].clue[0] (value 100) — 596 chars · sample: `Electric field is the negative gradient of potential: E = -gradient of V (3D vec`
  * cat[1].clue[1] (value 200) — 551 chars · sample: `Potential from field by integration: V(P) = -integral from reference to P of E .`
  * cat[1].clue[2] (value 300) — 503 chars · sample: `Direction of decreasing V matches the direction of E: E always points from high `
  * ... and 10 more
* **final-explanation-too-verbose** (1)
  * final — 878 chars

### `games/ap-physics-c-em/04 - Capacitance, Dielectrics, DC Circuits Jeopardy Review.html` — 19 flag(s), 26 items audited

* **explanation-too-verbose** (16)
  * cat[0].clue[0] (value 100) — 576 chars · sample: `A dielectric is an insulating material inserted between capacitor plates to incr`
  * cat[0].clue[1] (value 200) — 517 chars · sample: `Dielectric constant kappa is the factor by which capacitance increases when a di`
  * cat[0].clue[2] (value 300) — 546 chars · sample: `A dielectric reduces the electric field inside a capacitor by factor kappa: E_wi`
  * cat[0].clue[3] (value 400) — 607 chars · sample: `Polarization mechanism in a dielectric: atomic or molecular dipoles align with t`
  * cat[0].clue[4] (value 500) — 621 chars · sample: `Energy change when inserting a dielectric at constant V: increases. AP Physics C`
  * cat[1].clue[0] (value 100) — 548 chars · sample: `Electric current I is the time rate of charge flow: I = dQ/dt, with SI units amp`
  * cat[1].clue[3] (value 400) — 513 chars · sample: `Resistivity rho (Greek lowercase rho) is a material property with SI units ohm-m`
  * cat[1].clue[4] (value 500) — 519 chars · sample: `Wire resistance is R = rho*L/A, where rho is resistivity, L is length, and A is `
  * ... and 8 more
* **clue-too-terse** (2)
  * cat[3].clue[1] (value 200) — 10 chars · sample: `Loop rule.`
  * cat[3].clue[3] (value 400) — 11 chars · sample: `EMF symbol.`
* **final-explanation-too-verbose** (1)
  * final — 785 chars

### `games/ap-us-government/02 - Unit 2 Interactions Among Branches Jeopardy Review.html` — 19 flag(s), 26 items audited

* **explanation-too-verbose** (18)
  * cat[1].clue[0] (value 100) — 588 chars · sample: `Article II vests the executive power of the United States in a single President,`
  * cat[1].clue[1] (value 200) — 524 chars · sample: `Executive orders are legally binding presidential directives to the executive br`
  * cat[1].clue[2] (value 300) — 529 chars · sample: `The presidential veto (Article I, Section 7) allows the president to reject a bi`
  * cat[1].clue[4] (value 500) — 516 chars · sample: `A signing statement is a written pronouncement issued by a president when signin`
  * cat[2].clue[0] (value 100) — 573 chars · sample: `The federal bureaucracy consists of 15 cabinet departments, more than 100 indepe`
  * cat[2].clue[1] (value 200) — 533 chars · sample: `An iron triangle is the mutually reinforcing relationship among a congressional `
  * cat[2].clue[2] (value 300) — 537 chars · sample: `Bureaucratic rulemaking is the process by which federal agencies issue regulatio`
  * cat[2].clue[3] (value 400) — 511 chars · sample: `Congressional oversight is the authority of Congress to monitor, investigate, an`
  * ... and 10 more
* **final-explanation-too-verbose** (1)
  * final — 557 chars

### `games/economics/03 - Personal Finance Jeopardy Review.html` — 19 flag(s), 26 items audited

* **explanation-too-verbose** (18)
  * cat[0].clue[0] (value 100) — 514 chars · sample: `Compound interest is interest earned on both the original principal and the accu`
  * cat[0].clue[1] (value 200) — 539 chars · sample: `Government intervention occurs when the public sector uses taxes, subsidies, pri`
  * cat[0].clue[3] (value 400) — 512 chars · sample: `Public policy is the set of laws, regulations, government programs, and spending`
  * cat[0].clue[4] (value 500) — 504 chars · sample: `Net income is gross income minus all mandatory withholdings (federal, state, and`
  * cat[1].clue[0] (value 100) — 501 chars · sample: `A personal budget is a forward-looking plan that allocates expected net income a`
  * cat[1].clue[3] (value 400) — 504 chars · sample: `The interest rate is the price paid by borrowers to lenders expressed as a perce`
  * cat[1].clue[4] (value 500) — 523 chars · sample: `Retirement saving is the accumulation of assets during working years to fund con`
  * cat[2].clue[1] (value 200) — 522 chars · sample: `A policy scenario is a structured economic problem requiring students to trace t`
  * ... and 10 more
* **final-explanation-too-verbose** (1)
  * final — 505 chars

### `games/grade-5-science/01 - Matter and Energy in Ecosystems Jeopardy Review.html` — 19 flag(s), 26 items audited

* **explanation-too-verbose** (19)
  * cat[0].clue[0] (value 100) — 567 chars · sample: `Producers (autotrophs) are organisms like plants and algae that build sugars fro`
  * cat[0].clue[2] (value 300) — 526 chars · sample: `Chlorophyll is the green-colored molecule inside plant chloroplasts that absorbs`
  * cat[0].clue[3] (value 400) — 545 chars · sample: `A food web is a model that links many food chains so students can see how a sing`
  * cat[0].clue[4] (value 500) — 501 chars · sample: `An energy pyramid is a stacked-bar diagram showing that only about 10% of the en`
  * cat[1].clue[0] (value 100) — 523 chars · sample: `Plants pull carbon dioxide (CO2) from the surrounding air through tiny leaf open`
  * cat[1].clue[1] (value 200) — 526 chars · sample: `Photosynthesis is the chemical process where chloroplasts use light energy to co`
  * cat[1].clue[2] (value 300) — 518 chars · sample: `Chemical energy is energy stored in the bonds of molecules like sugars, fats, an`
  * cat[1].clue[3] (value 400) — 526 chars · sample: `Competition happens when organisms need the same limited resource, like food, wa`
  * ... and 11 more

### `games/grade-5/05 - Comparative Cultures Jeopardy Review.html` — 19 flag(s), 26 items audited

* **explanation-too-verbose** (18)
  * cat[0].clue[2] (value 300) — 505 chars · sample: `A tradition is a belief, practice, story, or way of doing things that is passed `
  * cat[0].clue[3] (value 400) — 514 chars · sample: `A cultural contribution is any idea, invention, food, art form, language, or pra`
  * cat[1].clue[0] (value 100) — 531 chars · sample: `Bilingual means being able to use two languages — and Canada is officially bilin`
  * cat[1].clue[2] (value 300) — 563 chars · sample: `First Nations is the Canadian term for Indigenous peoples (other than Inuit or M`
  * cat[1].clue[3] (value 400) — 533 chars · sample: `Parliamentary democracy is a system of government where citizens elect represent`
  * cat[1].clue[4] (value 500) — 530 chars · sample: `Multiculturalism is the idea that people of many different cultural backgrounds `
  * cat[2].clue[0] (value 100) — 530 chars · sample: `Latin America is the region of the Americas where Spanish, Portuguese, and Frenc`
  * cat[2].clue[1] (value 200) — 524 chars · sample: `Spanish is the official language of 20 countries in Latin America plus Spain, sp`
  * ... and 10 more
* **final-explanation-too-verbose** (1)
  * final — 616 chars

### `games/ap-comparative-government/01 - Political Systems and Regimes Jeopardy Review.html` — 18 flag(s), 26 items audited

* **explanation-too-terse** (18)
  * cat[0].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[0].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[1].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[1].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[1].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[1].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[2].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * cat[2].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 1.`
  * ... and 10 more

### `games/ap-comparative-government/05 - Political and Economic Changes and Development Jeopardy Review.html` — 18 flag(s), 26 items audited

* **explanation-too-terse** (18)
  * cat[0].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * cat[0].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * cat[0].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * cat[0].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * cat[1].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * cat[1].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * cat[1].clue[4] (value 500) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * cat[2].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 5.`
  * ... and 10 more

### `games/ap-economics-combined/06 - Stabilization Policy and Money Jeopardy Review.html` — 18 flag(s), 26 items audited

* **explanation-too-verbose** (17)
  * cat[0].clue[1] (value 200) — 514 chars · sample: `The Federal Reserve is the central bank of the United States, created in 1913, r`
  * cat[0].clue[2] (value 300) — 503 chars · sample: `Expansionary fiscal policy increases government spending (G) or cuts taxes (T), `
  * cat[0].clue[3] (value 400) — 528 chars · sample: `Contractionary fiscal policy reduces government spending (G) or raises taxes (T)`
  * cat[0].clue[4] (value 500) — 523 chars · sample: `An AD-AS policy shift occurs when fiscal or monetary policy moves the aggregate `
  * cat[1].clue[0] (value 100) — 540 chars · sample: `Open market purchases (expansionary OMO) occur when the Fed buys Treasury securi`
  * cat[1].clue[2] (value 300) — 537 chars · sample: `The reserve requirement is the minimum fraction of deposits that banks must hold`
  * cat[1].clue[4] (value 500) — 506 chars · sample: `The money multiplier = 1 / reserve requirement ratio. When the Fed injects $1 of`
  * cat[2].clue[0] (value 100) — 512 chars · sample: `The Federal Reserve Board of Governors consists of seven members appointed by th`
  * ... and 9 more
* **final-explanation-too-verbose** (1)
  * final — 576 chars

### `games/us-history-units/03 - Expansion and Reform Jeopardy Review.html` — 18 flag(s), 26 items audited

* **explanation-too-verbose** (17)
  * cat[0].clue[0] (value 100) — 542 chars · sample: `In 1803, President Thomas Jefferson purchased 828,000 square miles of territory `
  * cat[0].clue[2] (value 300) — 532 chars · sample: `The Oregon Trail was a roughly 2,000-mile overland route from Missouri to Oregon`
  * cat[0].clue[4] (value 500) — 551 chars · sample: `The Mexican-American War (1846–48) began after the U.S. annexation of Texas and `
  * cat[1].clue[2] (value 300) — 537 chars · sample: `The Trail of Tears (1838–39) was the forced removal of approximately 16,000 Cher`
  * cat[1].clue[3] (value 400) — 536 chars · sample: `In Cherokee Nation v. Georgia (1831), Chief Justice Marshall ruled that the Cher`
  * cat[1].clue[4] (value 500) — 554 chars · sample: `In Worcester v. Georgia (1832), Chief Justice Marshall ruled that Georgia's laws`
  * cat[2].clue[0] (value 100) — 516 chars · sample: `The abolition movement sought the immediate end of slavery and grew in force thr`
  * cat[2].clue[1] (value 200) — 506 chars · sample: `The Seneca Falls Convention (July 1848), organized by Elizabeth Cady Stanton and`
  * ... and 9 more
* **final-explanation-too-verbose** (1)
  * final — 660 chars

### `games/ap-music-theory-practice/practice-exam.html` — 18 flag(s), 40 items audited

* **prompt-missing-end-punct** (16)
  * q[7] id=apmt-008 · sample: `Syncopation is best described as:`
  * q[9] id=apmt-010 · sample: ` tempo, the meter is best classified as:`
  * q[16] id=apmt-017 · sample: `he tonic (1) in the soprano is called a:`
  * q[18] id=apmt-019 · sample: ` same direction is best classified as a:`
  * q[24] id=apmt-025 · sample: `adential 6/4 is correctly understood as:`
  * q[25] id=apmt-026 · sample: `re (borrowed chords) typically involves:`
  * q[26] id=apmt-027 · sample: `litan chord (♭II) in C minor is spelled:`
  * q[30] id=apmt-031 · sample: `tonal music is most commonly defined as:`
  * ... and 8 more
* **choices-length-variance** (2)
  * q[30] id=apmt-031 — min=23, max=106, ratio=4.6
  * q[32] id=apmt-033 — min=18, max=74, ratio=4.1

### `games/ap-comparative-government/04 - Party and Electoral Systems Jeopardy Review.html` — 17 flag(s), 26 items audited

* **explanation-too-terse** (17)
  * cat[0].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * cat[1].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * cat[1].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * cat[1].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * cat[1].clue[3] (value 400) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * cat[2].clue[0] (value 100) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * cat[2].clue[1] (value 200) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * cat[2].clue[2] (value 300) — 19 chars · sample: `AP Comp Gov Unit 4.`
  * ... and 9 more

### `games/ap-european-history/03 - Unit 3 Absolutism and Constitutionalism Jeopardy Review.html` — 17 flag(s), 26 items audited

* **explanation-too-verbose** (17)
  * cat[0].clue[0] (value 100) — 506 chars · sample: `Louis XIV transformed a hunting lodge at Versailles into Europe's grandest palac`
  * cat[0].clue[1] (value 200) — 526 chars · sample: `Absolutism describes the concentration of legislative, judicial, and executive p`
  * cat[0].clue[2] (value 300) — 525 chars · sample: `A constitutional monarchy limits the ruler's power through a fundamental law (wr`
  * cat[0].clue[3] (value 400) — 509 chars · sample: `Louis XIV (r.1643-1715) embodied French absolutism: he called himself the Sun Ki`
  * cat[0].clue[4] (value 500) — 504 chars · sample: `The Dutch Republic (1581-1795) was Europe's foremost commercial and financial po`
  * cat[1].clue[0] (value 100) — 504 chars · sample: `Parliamentary sovereignty — the principle that Parliament, not the monarch, hold`
  * cat[1].clue[1] (value 200) — 530 chars · sample: `The English Civil War (1642-1651) pitted King Charles I — invoking divine right `
  * cat[1].clue[3] (value 400) — 522 chars · sample: `The English Bill of Rights (1689), passed after the Glorious Revolution removed `
  * ... and 9 more

### `games/ap-music-theory/01 - Music Fundamentals I Jeopardy Review.html` — 17 flag(s), 26 items audited

* **explanation-too-verbose** (16)
  * cat[0].clue[0] (value 100) — 556 chars · sample: `Sharp (♯): Accidental symbol that raises a pitch by one half step (semitone). Fo`
  * cat[0].clue[1] (value 200) — 552 chars · sample: `Flat (♭): Accidental symbol that lowers a pitch by one half step (semitone). F m`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `C to E: Major third (M3) = 4 half steps (semitones). Examples in repertoire: ope`
  * cat[0].clue[3] (value 400) — 529 chars · sample: `C to F♯: Augmented fourth (A4) = 6 half steps, equal to the tritone. Enharmonic `
  * cat[0].clue[4] (value 500) — 555 chars · sample: `C♯ major (7 sharps) and D♭ major (5 flats) are enharmonic equivalents: same pitc`
  * cat[1].clue[1] (value 200) — 525 chars · sample: `Simple triple meter: 3 beats per measure (triple), each beat dividing into 2 equ`
  * cat[1].clue[3] (value 400) — 515 chars · sample: `Dotted note: a single dot after a note increases its duration by half. Dotted ha`
  * cat[1].clue[4] (value 500) — 591 chars · sample: `Syncopation: deliberately accenting weak beats or off-beats, displacing expected`
  * ... and 8 more
* **final-explanation-too-verbose** (1)
  * final — 598 chars

### `games/civics-pig/03 - Rights and Responsibilities Jeopardy Review.html` — 17 flag(s), 26 items audited

* **explanation-too-verbose** (16)
  * cat[0].clue[0] (value 100) — 522 chars · sample: `Petitioning the government—protected by the 1st Amendment—is the right of any pe`
  * cat[0].clue[1] (value 200) — 509 chars · sample: `Freedom of speech—1st Amendment, applied to states via the 14th—protects most ve`
  * cat[0].clue[2] (value 300) — 519 chars · sample: `Constitutional rights are not absolute; governments may impose reasonable limits`
  * cat[0].clue[4] (value 500) — 561 chars · sample: `The 6th Amendment guarantees six rights to criminal defendants: speedy trial, pu`
  * cat[1].clue[1] (value 200) — 522 chars · sample: `The 5th Amendment provides five distinct protections: (1) grand jury indictment `
  * cat[1].clue[3] (value 400) — 525 chars · sample: `Religious liberty policy navigates the tension between the 1st Amendment's two r`
  * cat[1].clue[4] (value 500) — 560 chars · sample: `Due process protections—rooted in the 5th (federal) and 14th (state) Amendments—`
  * cat[2].clue[0] (value 100) — 590 chars · sample: `Equal protection policy refers to the 14th Amendment's guarantee that no state s`
  * ... and 8 more
* **final-explanation-too-verbose** (1)
  * final — 576 chars

### `games/grade-5/06 - Government in the Western Hemisphere Jeopardy Review.html` — 17 flag(s), 26 items audited

* **explanation-too-verbose** (16)
  * cat[0].clue[1] (value 200) — 502 chars · sample: `A citizen is a legally recognized member of a country who has both rights — like`
  * cat[1].clue[0] (value 100) — 502 chars · sample: `Representative democracy is a system where citizens elect representatives to mak`
  * cat[1].clue[1] (value 200) — 508 chars · sample: `A federal system divides government power between a central (national) governmen`
  * cat[1].clue[4] (value 500) — 529 chars · sample: `Separation of powers divides government authority among three independent branch`
  * cat[2].clue[1] (value 200) — 502 chars · sample: `The English Bill of Rights (1689) was a law passed by the English Parliament tha`
  * cat[2].clue[2] (value 300) — 531 chars · sample: `The U.S. Constitution, written in 1787 and ratified in 1788, is the supreme law `
  * cat[2].clue[3] (value 400) — 516 chars · sample: `The Bill of Rights is the name for the first ten amendments to the U.S. Constitu`
  * cat[2].clue[4] (value 500) — 502 chars · sample: `Due process is the legal principle that the government must follow fair procedur`
  * ... and 8 more
* **final-explanation-too-verbose** (1)
  * final — 560 chars

### `games/grade-7/02 - Colonial Developments Jeopardy Review.html` — 17 flag(s), 26 items audited

* **explanation-too-verbose** (16)
  * cat[0].clue[3] (value 400) — 551 chars · sample: `The Columbian Exchange began after Columbus's 1492 voyage and reshaped the entir`
  * cat[0].clue[4] (value 500) — 502 chars · sample: `Missionaries were religious workers — often Jesuit or Franciscan priests — who a`
  * cat[1].clue[1] (value 200) — 513 chars · sample: `New France was France's North American empire, centered on the St. Lawrence Rive`
  * cat[2].clue[1] (value 200) — 507 chars · sample: `The Middle Colonies (New York, New Jersey, Pennsylvania, Delaware) were the most`
  * cat[2].clue[2] (value 300) — 505 chars · sample: `The Southern Colonies (Virginia, Maryland, North and South Carolina, Georgia) de`
  * cat[2].clue[4] (value 500) — 502 chars · sample: `The plantation system was a form of large-scale commercial farming using enslave`
  * cat[3].clue[0] (value 100) — 570 chars · sample: `Enslavement is the legal and physical reduction of human beings to property — fo`
  * cat[3].clue[1] (value 200) — 523 chars · sample: `The Middle Passage was the second leg of the triangular trade — the voyage from `
  * ... and 8 more
* **final-explanation-too-verbose** (1)
  * final — 559 chars

### `games/us-regents-sprint/Day 1 - Colonial Constitution Supreme Court Review Game.html` — 17 flag(s), 26 items audited

* **explanation-too-verbose** (16)
  * cat[0].clue[0] (value 100) — 501 chars · sample: `Signed aboard the Mayflower on November 21, 1620, the Mayflower Compact created `
  * cat[1].clue[0] (value 100) — 509 chars · sample: `Passed by Parliament in 1765, the Stamp Act imposed a direct tax on printed mate`
  * cat[1].clue[2] (value 300) — 523 chars · sample: `Meeting in Philadelphia from May 1775 through 1781, the Second Continental Congr`
  * cat[1].clue[3] (value 400) — 510 chars · sample: `Adopted July 4, 1776, the Declaration of Independence drew on John Locke's socia`
  * cat[1].clue[4] (value 500) — 541 chars · sample: `English philosopher John Locke (1632–1704) argued in his Two Treatises of Govern`
  * cat[2].clue[2] (value 300) — 527 chars · sample: `Passed by the Confederation Congress in 1787, the Northwest Ordinance establishe`
  * cat[2].clue[3] (value 400) — 520 chars · sample: `Proposed by Roger Sherman of Connecticut at the 1787 Constitutional Convention, `
  * cat[2].clue[4] (value 500) — 509 chars · sample: `Federalists — including Alexander Hamilton, James Madison, and John Jay — suppor`
  * ... and 8 more
* **final-explanation-too-verbose** (1)
  * final — 578 chars

### `games/ap-economics-combined/05 - Macro Indicators and AD-AS Jeopardy Review.html` — 16 flag(s), 26 items audited

* **explanation-too-verbose** (15)
  * cat[0].clue[1] (value 200) — 508 chars · sample: `The aggregate demand (AD) curve shows the inverse relationship between the price`
  * cat[1].clue[2] (value 300) — 521 chars · sample: `A demand shock is a sudden, unexpected change in aggregate spending that shifts `
  * cat[2].clue[0] (value 100) — 512 chars · sample: `Monetary policy is the Federal Reserve's use of open market operations, the fede`
  * cat[2].clue[1] (value 200) — 501 chars · sample: `A supply shock is a sudden, unexpected change in production costs or resource av`
  * cat[2].clue[2] (value 300) — 530 chars · sample: `Inflation is a sustained increase in the general price level, measured by the Co`
  * cat[2].clue[3] (value 400) — 542 chars · sample: `Stagflation is the combination of stagnant output (rising unemployment) and risi`
  * cat[2].clue[4] (value 500) — 508 chars · sample: `An inflationary gap occurs when actual real GDP exceeds potential GDP (LRAS), me`
  * cat[3].clue[1] (value 200) — 534 chars · sample: `Central bank independence means the monetary authority can make policy decisions`
  * ... and 7 more
* **final-explanation-too-verbose** (1)
  * final — 564 chars

### `games/economics/04 - Macroeconomics Jeopardy Review.html` — 16 flag(s), 26 items audited

* **explanation-too-verbose** (15)
  * cat[0].clue[3] (value 400) — 520 chars · sample: `The Long-Run Aggregate Supply (LRAS) curve is a vertical line at the economy's p`
  * cat[0].clue[4] (value 500) — 510 chars · sample: `Economic growth is the sustained increase in real GDP (or real GDP per capita) o`
  * cat[1].clue[0] (value 100) — 530 chars · sample: `Fiscal policy is the use of government spending and taxation by Congress and the`
  * cat[1].clue[1] (value 200) — 548 chars · sample: `A supply shock is an unexpected event that dramatically changes production costs`
  * cat[2].clue[1] (value 200) — 509 chars · sample: `The CPI measures changes in the price of a fixed market basket of about 80,000 g`
  * cat[2].clue[3] (value 400) — 542 chars · sample: `Transfer payments are government payments to individuals — Social Security, Medi`
  * cat[2].clue[4] (value 500) — 538 chars · sample: `Stagflation is the rare and painful combination of high inflation and high unemp`
  * cat[3].clue[0] (value 100) — 502 chars · sample: `The federal budget is the annual fiscal plan outlining proposed spending (mandat`
  * ... and 7 more
* **final-explanation-too-verbose** (1)
  * final — 561 chars

### `games/global-9/02 - Belief Systems Jeopardy Review.html` — 16 flag(s), 26 items audited

* **explanation-too-verbose** (16)
  * cat[0].clue[1] (value 200) — 564 chars · sample: `The caste system divided traditional Hindu society into four hereditary varnas: `
  * cat[0].clue[3] (value 400) — 511 chars · sample: `Karma is the Hindu and Buddhist law of moral cause and effect: every action — go`
  * cat[1].clue[1] (value 200) — 513 chars · sample: `The Four Noble Truths are the core of the Buddha's first teaching: (1) life invo`
  * cat[1].clue[4] (value 500) — 503 chars · sample: `Buddhism spread from its birthplace in northern India along Silk Road trade rout`
  * cat[2].clue[1] (value 200) — 535 chars · sample: `Islam ('submission to God') was founded by the Prophet Muhammad (570–632 CE) in `
  * cat[2].clue[2] (value 300) — 516 chars · sample: `Monotheism — the belief in one all-powerful, all-knowing God — distinguished anc`
  * cat[2].clue[3] (value 400) — 557 chars · sample: `Christianity emerged from Judaism in 1st-century Roman Palestine, centered on th`
  * cat[2].clue[4] (value 500) — 506 chars · sample: `The Ten Commandments are ten laws that, according to the Hebrew Bible, God revea`
  * ... and 8 more

### `games/grade-11-ela/03 - Reading Informational - Main Idea Argument Evidence Jeopardy Review.html` — 15 flag(s), 26 items audited

* **explanation-too-verbose** (14)
  * cat[0].clue[0] (value 100) — 509 chars · sample: `Central idea is the overarching point of an informational text, supported by det`
  * cat[0].clue[1] (value 200) — 509 chars · sample: `A claim is the author's arguable position. RI.11-12.6 covers point of view; RI.1`
  * cat[0].clue[2] (value 300) — 502 chars · sample: `A counterclaim is the opposing position a writer addresses to strengthen the mai`
  * cat[0].clue[3] (value 400) — 538 chars · sample: `Supporting details are specific facts, examples, anecdotes, statistics, and quot`
  * cat[0].clue[4] (value 500) — 564 chars · sample: `Frederick Douglass's Narrative of the Life of Frederick Douglass, an American Sl`
  * cat[1].clue[0] (value 100) — 502 chars · sample: `A claim of policy advocates a specific action ('Citizens should refuse to pay un`
  * cat[1].clue[1] (value 200) — 523 chars · sample: `Evidence has two quality dimensions: sufficiency (enough) and relevance (actuall`
  * cat[1].clue[3] (value 400) — 556 chars · sample: `Strong evaluation matches evidence to specific claims, not just to the overall a`
  * ... and 6 more
* **final-explanation-too-verbose** (1)
  * final — 516 chars

### `games/grade-5-science/03 - Space Systems Jeopardy Review.html` — 15 flag(s), 26 items audited

* **explanation-too-verbose** (15)
  * cat[0].clue[0] (value 100) — 540 chars · sample: `The Moon is Earth's only natural satellite, about 238,855 miles away, with a dia`
  * cat[0].clue[3] (value 400) — 509 chars · sample: `A lunar eclipse happens when Earth passes between the Sun and the Moon, casting `
  * cat[1].clue[0] (value 100) — 506 chars · sample: `Gravity is the invisible pulling force every object with mass exerts on every ot`
  * cat[1].clue[1] (value 200) — 540 chars · sample: `Earth's gravity always pulls objects toward the planet's center, which we experi`
  * cat[2].clue[0] (value 100) — 513 chars · sample: `A star is a giant ball of glowing plasma (mostly hydrogen and helium) held toget`
  * cat[2].clue[2] (value 300) — 527 chars · sample: `The Sun looks much brighter than other stars because it is much closer to Earth.`
  * cat[2].clue[3] (value 400) — 567 chars · sample: `A constellation is a group of stars that form a recognizable pattern in the nigh`
  * cat[3].clue[0] (value 100) — 519 chars · sample: `Rotation is the spinning of Earth on its axis, completing one full turn every 24`
  * ... and 7 more

### `games/ap-calc-bc-practice/practice-exam.html` — 15 flag(s), 45 items audited

* **prompt-missing-end-punct** (14)
  * q[2] id=apcalcbc-003 · sample: `ty) (4x^3 - x + 7)/(2x^3 + 5x^2) equals:`
  * q[3] id=apcalcbc-004 · sample: `If f(x) = x^4 - 6x^2 + 1, then f'(x) =`
  * q[5] id=apcalcbc-006 · sample: `If y = sin(3x^2 + 1), then dy/dx =`
  * q[7] id=apcalcbc-008 · sample: `nd f(2) = 7 with f'(2) = 4, then g'(7) =`
  * q[11] id=apcalcbc-012 · sample: `x - 12, the graph of f is concave up on:`
  * q[13] id=apcalcbc-014 · sample: `ists c in (1, 4) such that f'(c) equals:`
  * q[17] id=apcalcbc-018 · sample: `0 to x of sqrt(1 + t^4) dt, then F'(x) =`
  * q[30] id=apcalcbc-031 · sample: `(t) = <t^2, t^3>. Its speed at t = 1 is:`
  * ... and 6 more
* **prompt-too-terse** (1)
  * q[4] id=apcalcbc-005 — 26 chars (<30) · sample: `Find d/dx[ x^2 * cos(x) ].`

### `games/regents-global-2/practice-exam.html` — 15 flag(s), 40 items audited

* **explanation-missing-end-punct** (2)
  * q[11] id=ghii-012 · sample: `ng Kong and opening five 'treaty ports.'`
  * q[32] id=ghii-033 · sample: ` world's failure to apply 'never again.'`
* **prompt-missing-end-punct** (10)
  * q[12] id=ghii-013 · sample: `rd) differed from China's because Japan:`
  * q[13] id=ghii-014 · sample: `g-term causes of World War I stands for:`
  * q[17] id=ghii-018 · sample: `Year Plans in the USSR were designed to:`
  * q[21] id=ghii-022 · sample: `zi genocide that murdered approximately:`
  * q[22] id=ghii-023 · sample: `rily justified by his administration as:`
  * q[23] id=ghii-024 · sample: `n Doctrine established a U.S. policy of:`
  * q[25] id=ghii-026 · sample: `55) were Cold War alliances designed to:`
  * q[32] id=ghii-033 · sample: `n genocide was carried out primarily by:`
  * ... and 2 more
* **choices-length-variance** (3)
  * q[23] id=ghii-024 — min=25, max=102, ratio=4.1
  * q[30] id=ghii-031 — min=35, max=143, ratio=4.1
  * q[38] id=ghii-039 — min=20, max=102, ratio=5.1

### `games/grade-9-ela/07 - Language - Grammar Vocabulary Figurative Jeopardy Review.html` — 14 flag(s), 26 items audited

* **explanation-too-verbose** (13)
  * cat[0].clue[2] (value 300) — 526 chars · sample: `Nonrestrictive (non-essential) clauses add information that could be removed wit`
  * cat[0].clue[3] (value 400) — 521 chars · sample: `A comma splice joins two independent clauses with only a comma. 'Atticus defende`
  * cat[1].clue[2] (value 300) — 562 chars · sample: `Adverbs modify verbs (ran quickly), adjectives (very green), and other adverbs (`
  * cat[1].clue[4] (value 500) — 539 chars · sample: `Parallel structure (parallelism) places equivalent ideas in equivalent grammatic`
  * cat[2].clue[0] (value 100) — 507 chars · sample: `The Latin root 'bene' (good) generates 'benevolent' (wishing well), 'benefit' (a`
  * cat[2].clue[1] (value 200) — 517 chars · sample: `Greek root 'graph' (write) generates 'autograph' (self-writing), 'biography' (li`
  * cat[2].clue[3] (value 400) — 529 chars · sample: `Greek root 'demos' (people) generates 'democracy' (rule by the people), 'demogra`
  * cat[2].clue[4] (value 500) — 514 chars · sample: `Latin root 'dict' (say, speak) generates 'dictate' (speak forth), 'predict' (spe`
  * ... and 5 more
* **final-explanation-too-verbose** (1)
  * final — 570 chars

### `games/precalculus/08 - Sequences Series and Limits Jeopardy Review.html` — 14 flag(s), 26 items audited

* **explanation-too-verbose** (13)
  * cat[0].clue[0] (value 100) — 510 chars · sample: `Limit definition (informal): lim x->a f(x) = L means that f(x) can be made arbit`
  * cat[0].clue[4] (value 500) — 515 chars · sample: `L'Hopital's Rule: For 0/0 or inf/inf indeterminate forms, lim x->a f(x)/g(x) = l`
  * cat[1].clue[2] (value 300) — 544 chars · sample: `Recursive sequence: Each term depends on one or more previous terms. Example: Fi`
  * cat[1].clue[3] (value 400) — 508 chars · sample: `Harmonic series: Σ 1/n = 1 + 1/2 + 1/3 + 1/4 +... DIVERGES, even though terms ap`
  * cat[2].clue[0] (value 100) — 503 chars · sample: `One-sided limit at vertical asymptote: lim x->0^+ 1/x = +inf. As x approaches 0 `
  * cat[2].clue[1] (value 200) — 506 chars · sample: `Limit at infinity for rational: same degree numerator and denominator, ratio of `
  * cat[2].clue[2] (value 300) — 521 chars · sample: `Famous limit: lim h->0 (sin h)/h = 1 (h in radians). Foundation for derivative o`
  * cat[2].clue[3] (value 400) — 505 chars · sample: `Limit of rational sequence: a_n = (3n+1)/(n+2). Divide num/denom by n: a_n = (3 `
  * ... and 5 more
* **final-explanation-too-verbose** (1)
  * final — 565 chars

### `games/regents-chemistry/practice-exam.html` — 14 flag(s), 40 items audited

* **prompt-missing-end-punct** (14)
  * q[3] id=chem-004 · sample: `erent mass numbers. These atoms must be:`
  * q[4] id=chem-005 · sample: `Periodic Table, atomic radius generally:`
  * q[10] id=chem-011 · sample: `onds are polar. The best explanation is:`
  * q[11] id=chem-012 · sample: ` coefficients, the coefficient of O2 is:`
  * q[14] id=chem-015 · sample: `calcium carbonate (CaCO3) is closest to:`
  * q[16] id=chem-017 · sample: `per 100 g of water is best described as:`
  * q[18] id=chem-019 · sample: `reaction system affects the reaction by:`
  * q[21] id=chem-022 · sample: `substance that, when dissolved in water:`
  * ... and 6 more

### `games/regents-physics/practice-exam.html` — 14 flag(s), 40 items audited

* **prompt-missing-end-punct** (14)
  * q[4] id=physics-005 · sample: `air resistance) will land at the ground:`
  * q[9] id=physics-010 · sample: `il exerts on the hammer a force that is:`
  * q[16] id=physics-017 · sample: `orce of attraction between them becomes:`
  * q[21] id=physics-022 · sample: `rmal. As the light enters the water, it:`
  * q[22] id=physics-023 · sample: `ith crest), the resulting wave exhibits:`
  * q[23] id=physics-024 · sample: `en, the frequency the listener hears is:`
  * q[25] id=physics-026 · sample: `static force between them is closest to:`
  * q[29] id=physics-030 · sample: `tery have a combined resistance that is:`
  * ... and 6 more

### `games/ap-psychology/99 - AP Psychology Final Exam Comprehensive Review.html` — 13 flag(s), 26 items audited

* **explanation-too-verbose** (12)
  * cat[1].clue[2] (value 300) — 507 chars · sample: `The amygdala is the almond-shaped limbic structure critical for fear conditionin`
  * cat[1].clue[4] (value 500) — 540 chars · sample: `Signal Detection Theory (SDT) explains how people detect weak signals amid backg`
  * cat[2].clue[1] (value 200) — 510 chars · sample: `Working memory (Baddeley's model) is the active cognitive system that temporaril`
  * cat[2].clue[4] (value 500) — 507 chars · sample: `The availability heuristic (Tversky and Kahneman, 1973) involves judging the pro`
  * cat[3].clue[2] (value 300) — 525 chars · sample: `Classical conditioning (Pavlov) is learning through temporal association of a ne`
  * cat[3].clue[3] (value 400) — 502 chars · sample: `Operant conditioning (Skinner) shapes voluntary behavior through reinforcement (`
  * cat[3].clue[4] (value 500) — 509 chars · sample: `Observational learning (Bandura) is acquiring behavior, attitudes, or emotional `
  * cat[4].clue[0] (value 100) — 534 chars · sample: `Cognitive dissonance (Festinger, 1957) is the discomfort experienced when cognit`
  * ... and 4 more
* **final-explanation-too-verbose** (1)
  * final — 585 chars

### `games/geometry/02 - Congruence and Proof Jeopardy Review.html` — 13 flag(s), 26 items audited

* **explanation-too-verbose** (12)
  * cat[0].clue[0] (value 100) — 542 chars · sample: `The given statement opens a two-column proof, listing all information stated in `
  * cat[0].clue[1] (value 200) — 525 chars · sample: `The prove statement names the conclusion that a two-column proof must establish `
  * cat[0].clue[2] (value 300) — 537 chars · sample: `A theorem is a mathematical statement proved deductively from postulates, defini`
  * cat[0].clue[3] (value 400) — 515 chars · sample: `A postulate (axiom) is a statement accepted as true without proof — the starting`
  * cat[0].clue[4] (value 500) — 536 chars · sample: `A logical sequence in a two-column proof is the ordered chain of statements, eac`
  * cat[2].clue[3] (value 400) — 516 chars · sample: `Base angles are the two congruent angles opposite the congruent sides of an isos`
  * cat[3].clue[0] (value 100) — 512 chars · sample: `A transversal is a line that intersects two or more other lines at distinct poin`
  * cat[3].clue[1] (value 200) — 522 chars · sample: `Alternate interior angles are on opposite sides of a transversal and between the`
  * ... and 4 more
* **explanation-missing-end-punct** (1)
  * cat[0].clue[3] (value 400) · sample: `le Addition Postulate,' 'SAS Postulate.'`

### `games/geometry/03 - Similarity Jeopardy Review.html` — 13 flag(s), 26 items audited

* **explanation-too-verbose** (13)
  * cat[0].clue[0] (value 100) — 561 chars · sample: `AA (Angle-Angle) Similarity Theorem: two triangles are similar when two pairs of`
  * cat[0].clue[1] (value 200) — 521 chars · sample: `SAS Similarity Theorem: two triangles are similar when two pairs of correspondin`
  * cat[0].clue[2] (value 300) — 555 chars · sample: `SSS Similarity Theorem: two triangles are similar when all three pairs of corres`
  * cat[0].clue[3] (value 400) — 577 chars · sample: `Two triangles are similar (△ABC ~ △DEF) if corresponding angles are congruent an`
  * cat[0].clue[4] (value 500) — 505 chars · sample: `A scale drawing is a diagram in which all lengths are proportional to the actual`
  * cat[1].clue[0] (value 100) — 506 chars · sample: `In similar figures, proportional sides means corresponding side lengths form equ`
  * cat[1].clue[2] (value 300) — 514 chars · sample: `The geometric mean of two positive numbers a and b is x=√(ab), where a/x = x/b (`
  * cat[2].clue[0] (value 100) — 532 chars · sample: `The center of dilation is the fixed point from which all image points are locate`
  * ... and 5 more

### `games/geometry/08 - Geometric Modeling Jeopardy Review.html` — 13 flag(s), 26 items audited

* **explanation-too-verbose** (13)
  * cat[0].clue[0] (value 100) — 516 chars · sample: `A diagram assumption is a property — right angle, parallelism, congruence — acce`
  * cat[0].clue[1] (value 200) — 518 chars · sample: `A constraint is a physical, mathematical, or design limit restricting possible s`
  * cat[0].clue[2] (value 300) — 520 chars · sample: `Precision in measurement is the degree of detail, determined by the smallest uni`
  * cat[0].clue[4] (value 500) — 511 chars · sample: `A reasonable approximation is a value close enough to the exact answer for the r`
  * cat[1].clue[0] (value 100) — 531 chars · sample: `A compass construction uses only a compass (for arcs and circles) and a straight`
  * cat[1].clue[1] (value 200) — 505 chars · sample: `A straightedge is an unmarked ruler used in compass-and-straightedge constructio`
  * cat[1].clue[3] (value 400) — 503 chars · sample: `Construction of perpendicular bisector: (1) from each endpoint, draw arcs of equ`
  * cat[2].clue[2] (value 300) — 508 chars · sample: `A surveying triangle is established on the ground using measured side lengths an`
  * ... and 5 more

### `games/grade-5-science/99 - Cumulative Yearlong Jeopardy Review.html` — 13 flag(s), 26 items audited

* **explanation-too-verbose** (12)
  * cat[0].clue[0] (value 100) — 513 chars · sample: `Evaporation is the change from liquid to gas that happens as faster-moving parti`
  * cat[0].clue[2] (value 300) — 503 chars · sample: `A solution is a mixture where one substance (solute) dissolves evenly in another`
  * cat[0].clue[4] (value 500) — 542 chars · sample: `The four classic clues of a chemical change are: a new gas (bubbles), a color ch`
  * cat[1].clue[0] (value 100) — 530 chars · sample: `Producers (plants, algae, some bacteria) form the base of every food chain by ca`
  * cat[1].clue[2] (value 300) — 531 chars · sample: `Decomposers like soil bacteria and mushrooms break down dead organisms and waste`
  * cat[2].clue[2] (value 300) — 513 chars · sample: `The Sun looks brighter than all other stars because it is only 93 million miles `
  * cat[2].clue[4] (value 500) — 509 chars · sample: `Planets are the eight largest bodies orbiting the Sun: Mercury, Venus, Earth, Ma`
  * cat[3].clue[0] (value 100) — 507 chars · sample: `Gravity is the invisible attractive force every object with mass exerts on every`
  * ... and 4 more
* **final-explanation-too-verbose** (1)
  * final — 513 chars

### `games/us-history-units/02 - Constitutional Foundations Jeopardy Review.html` — 13 flag(s), 26 items audited

* **explanation-too-verbose** (12)
  * cat[1].clue[1] (value 200) — 564 chars · sample: `The Articles of Confederation (ratified 1781) was the United States' first const`
  * cat[1].clue[2] (value 300) — 502 chars · sample: `The Electoral College (Article II, Section 1) is the indirect system for electin`
  * cat[1].clue[4] (value 500) — 520 chars · sample: `Shays' Rebellion (1786–87) was an armed uprising of debt-ridden Massachusetts fa`
  * cat[2].clue[0] (value 100) — 519 chars · sample: `The Declaration of Independence (July 4, 1776), written primarily by Thomas Jeff`
  * cat[2].clue[2] (value 300) — 502 chars · sample: `Popular sovereignty — the principle that all government authority derives from t`
  * cat[2].clue[3] (value 400) — 507 chars · sample: `Natural rights — articulated by John Locke as 'life, liberty, and property' and `
  * cat[2].clue[4] (value 500) — 569 chars · sample: `The Three-Fifths Compromise (1787) counted enslaved people as three-fifths of a `
  * cat[3].clue[0] (value 100) — 524 chars · sample: `Thomas Jefferson, Virginia planter and Renaissance man, was the primary author o`
  * ... and 4 more
* **final-explanation-too-verbose** (1)
  * final — 528 chars

### `games/ap-env-sci-practice/practice-exam.html` — 13 flag(s), 40 items audited

* **prompt-missing-end-punct** (9)
  * q[7] id=apes-008 · sample: `days. This pattern is best described as:`
  * q[17] id=apes-018 · sample: `ase stormwater runoff primarily because:`
  * q[24] id=apes-025 · sample: `s electricity use most directly because:`
  * q[25] id=apes-026 · sample: `, non-renewable resource over time will:`
  * q[30] id=apes-031 · sample: `reys. This pattern is best described as:`
  * q[32] id=apes-033 · sample: `r stream life immediately downstream is:`
  * q[34] id=apes-035 · sample: ` is most often cited as a case study of:`
  * q[37] id=apes-038 · sample: `l reefs, oysters, and pteropods because:`
  * ... and 1 more
* **choices-length-variance** (4)
  * q[26] id=apes-027 — min=28, max=125, ratio=4.5
  * q[33] id=apes-034 — min=25, max=104, ratio=4.2
  * q[35] id=apes-036 — min=38, max=162, ratio=4.3
  * q[37] id=apes-038 — min=36, max=148, ratio=4.1

### `games/ap-euro-practice/practice-exam.html` — 13 flag(s), 45 items audited

* **prompt-too-verbose** (3)
  * q[0] id=apeuro-001 — 331 chars (>300) · sample: `Source: Baldassare Castiglione, The Book of the Courtier (1528), advising a nobl`
  * q[10] id=apeuro-011 — 330 chars (>300) · sample: `Source: A French courtier writing in his memoirs about Louis XIV at Versailles i`
  * q[15] id=apeuro-016 — 318 chars (>300) · sample: `Source: Isaac Newton, Philosophiæ Naturalis Principia Mathematica (1687), Book I`
* **explanation-missing-end-punct** (1)
  * q[14] id=apeuro-015 · sample: `ity—a textbook 'enlightened absolutist.'`
* **prompt-missing-end-punct** (6)
  * q[17] id=apeuro-018 · sample: `ment in this work is best summarized as:`
  * q[19] id=apeuro-020 · sample: `Wollstonecraft's main argument was that:`
  * q[26] id=apeuro-027 · sample: `rectly transformed European industry by:`
  * q[29] id=apeuro-030 · sample: `as being driven by the conflict between:`
  * q[37] id=apeuro-038 · sample: `adimir Lenin, resulted most directly in:`
  * q[41] id=apeuro-042 · sample: `ates in 1948, was designed primarily to:`
* **choices-length-variance** (3)
  * q[28] id=apeuro-029 — min=26, max=122, ratio=4.7
  * q[29] id=apeuro-030 — min=20, max=83, ratio=4.2
  * q[40] id=apeuro-041 — min=24, max=122, ratio=5.1

### `games/ap-european-history/02 - Unit 2 Age of Reformation Jeopardy Review.html` — 12 flag(s), 26 items audited

* **explanation-too-verbose** (11)
  * cat[0].clue[0] (value 100) — 515 chars · sample: `Martin Luther (1483-1546), an Augustinian friar and theology professor at Witten`
  * cat[1].clue[2] (value 300) — 501 chars · sample: `The Council of Trent (1545-1563) was the Catholic Church's comprehensive respons`
  * cat[2].clue[3] (value 400) — 505 chars · sample: `Henry IV of France issued the Edict of Nantes in 1598, granting French Huguenots`
  * cat[2].clue[4] (value 500) — 522 chars · sample: `The Protestant Reformation (1517-c.1648) fractured Western Christian unity, spaw`
  * cat[3].clue[0] (value 100) — 524 chars · sample: `England's Act of Supremacy (1534) declared Henry VIII 'the only Supreme Head on `
  * cat[3].clue[1] (value 200) — 512 chars · sample: `Ignatius of Loyola (1491-1556) founded the Society of Jesus (Jesuits) in 1540, o`
  * cat[3].clue[2] (value 300) — 540 chars · sample: `German princes within the Holy Roman Empire supported Luther partly from genuine`
  * cat[4].clue[0] (value 100) — 514 chars · sample: `Sola fide ('by faith alone') was Luther's core theological breakthrough, drawn f`
  * ... and 3 more
* **final-explanation-too-verbose** (1)
  * final — 532 chars

### `games/ap-physics-c-em/07 - Maxwell's Equations and EM Waves Jeopardy Review.html` — 12 flag(s), 26 items audited

* **explanation-too-verbose** (11)
  * cat[0].clue[0] (value 100) — 527 chars · sample: `First Maxwell equation: Gauss's law for E in differential form: gradient . E = r`
  * cat[0].clue[1] (value 200) — 536 chars · sample: `Second Maxwell equation: Gauss's law for B: gradient . B = 0 (differential) or c`
  * cat[0].clue[3] (value 400) — 516 chars · sample: `Fourth Maxwell equation: Ampere-Maxwell law: gradient x B = mu_0*J + mu_0*epsilo`
  * cat[0].clue[4] (value 500) — 580 chars · sample: `James Clerk Maxwell (1831-1879) was the Scottish physicist who unified the laws `
  * cat[1].clue[0] (value 100) — 553 chars · sample: `Displacement current is the term Maxwell added to Ampere's law in 1864: I_d = ep`
  * cat[1].clue[2] (value 300) — 575 chars · sample: `Reason Maxwell added the displacement current: to maintain charge conservation (`
  * cat[1].clue[4] (value 500) — 536 chars · sample: `Displacement current between capacitor plates equals the conduction current in t`
  * cat[2].clue[0] (value 100) — 534 chars · sample: `Electromagnetic waves are self-propagating disturbances of E and B fields, predi`
  * ... and 3 more
* **final-explanation-too-verbose** (1)
  * final — 954 chars

### `games/grade-10-ela/03 - Reading Informational - Main Idea Argument Evidence Jeopardy Review.html` — 12 flag(s), 26 items audited

* **explanation-too-verbose** (11)
  * cat[0].clue[0] (value 100) — 505 chars · sample: `Main idea (central idea) is the overarching point of an informational text, supp`
  * cat[0].clue[1] (value 200) — 509 chars · sample: `A claim is the author's arguable position. RI.9-10.6 examines purpose; RI.9-10.8`
  * cat[1].clue[0] (value 100) — 531 chars · sample: `A claim of value judges merit, ethics, or aesthetics. King's letter argues a cla`
  * cat[1].clue[1] (value 200) — 508 chars · sample: `Hasty generalization draws a broad conclusion from insufficient evidence. 'My un`
  * cat[1].clue[2] (value 300) — 514 chars · sample: `A claim of cause asserts that X causes Y (or Y is the effect of X). Causal claim`
  * cat[1].clue[3] (value 400) — 507 chars · sample: `Evidence sufficiency means enough evidence supports the claim. A single example `
  * cat[2].clue[3] (value 400) — 514 chars · sample: `Ethos is Aristotle's appeal based on speaker character and credibility. King est`
  * cat[3].clue[1] (value 200) — 508 chars · sample: `Currency is one of five CRAAP-test source-evaluation criteria (Currency, Relevan`
  * ... and 3 more
* **final-explanation-too-verbose** (1)
  * final — 540 chars

### `games/ap-chem-practice/practice-exam.html` — 12 flag(s), 40 items audited

* **prompt-missing-end-punct** (9)
  * q[7] id=apchem-008 · sample: `tals from ionic and molecular solids is:`
  * q[11] id=apchem-012 · sample: `mperature. The best explanation is that:`
  * q[13] id=apchem-014 · sample: `. This phenomenon is best classified as:`
  * q[17] id=apchem-018 · sample: `zed and the element that is reduced are:`
  * q[19] id=apchem-020 · sample: ` of A is doubled, the initial rate will:`
  * q[21] id=apchem-022 · sample: `equation k = A·e^(−Ea/RT) predicts that:`
  * q[33] id=apchem-034 · sample: `n this solution, compared to pure water:`
  * q[34] id=apchem-035 · sample: `HCl (a strong acid) at 25°C has a pH of:`
  * ... and 1 more
* **prompt-too-verbose** (1)
  * q[25] id=apchem-026 — 302 chars (>300) · sample: `In a coffee-cup calorimeter, 100.0 mL of 1.00 M HCl at 22.0°C is mixed with 100.`
* **choices-length-variance** (2)
  * q[33] id=apchem-034 — min=12, max=70, ratio=5.8
  * q[37] id=apchem-038 — min=26, max=135, ratio=5.2

### `games/ap-physics-c-em/06 - Electromagnetic Induction Jeopardy Review.html` — 11 flag(s), 26 items audited

* **explanation-too-verbose** (10)
  * cat[0].clue[0] (value 100) — 539 chars · sample: `Faraday's law states that the EMF induced in a circuit equals the negative time `
  * cat[0].clue[1] (value 200) — 505 chars · sample: `Faraday's law equation: EMF = -d(Phi_B)/dt, where Phi_B = integral B . dA is the`
  * cat[0].clue[2] (value 300) — 520 chars · sample: `Magnetic flux through a surface is Phi_B = integral B . dA, where dA is the area`
  * cat[0].clue[4] (value 500) — 584 chars · sample: `Lenz's law states that the direction of induced current is such that its magneti`
  * cat[1].clue[0] (value 100) — 501 chars · sample: `Motional EMF is the EMF induced in a conductor moving through a magnetic field. `
  * cat[1].clue[2] (value 300) — 502 chars · sample: `Current direction in a rod-rails circuit is determined by Lenz's law: the induce`
  * cat[1].clue[3] (value 400) — 524 chars · sample: `Force on a moving conductor in a magnetic field, due to the induced current, opp`
  * cat[2].clue[0] (value 100) — 529 chars · sample: `Self-inductance L is the property of a circuit (especially a coil) that opposes `
  * ... and 2 more
* **final-explanation-too-verbose** (1)
  * final — 1009 chars

### `games/civics-pig/02 - Constitutional Structure Jeopardy Review.html` — 11 flag(s), 26 items audited

* **explanation-too-verbose** (11)
  * cat[0].clue[0] (value 100) — 623 chars · sample: `The Bill of Rights—the first ten amendments, ratified in 1791—was added to the C`
  * cat[0].clue[2] (value 300) — 527 chars · sample: `The Constitutional Convention met in Philadelphia from May to September 1787, in`
  * cat[0].clue[4] (value 500) — 517 chars · sample: `Representative democracy (also called a republic) is a system in which citizens `
  * cat[2].clue[1] (value 200) — 595 chars · sample: `The Due Process Clause appears in both the 5th Amendment (federal government) an`
  * cat[2].clue[3] (value 400) — 521 chars · sample: `Section 1 of the 14th Amendment's Equal Protection Clause (1868) requires states`
  * cat[2].clue[4] (value 500) — 526 chars · sample: `The Elastic Clause (Art. I, Sec. 8, Cl. 18)—also called the Necessary and Proper`
  * cat[3].clue[0] (value 100) — 509 chars · sample: `Federalism, America's constitutional structure, divides sovereignty between the `
  * cat[3].clue[3] (value 400) — 522 chars · sample: `Implied powers are federal authorities not explicitly listed in the Constitution`
  * ... and 3 more

### `games/grade-5-math/03 - Fraction Operations Jeopardy Review.html` — 11 flag(s), 26 items audited

* **explanation-too-verbose** (10)
  * cat[0].clue[0] (value 100) — 527 chars · sample: `Worked example: a rectangle divided into 4 equal parts with 3 shaded represents `
  * cat[0].clue[1] (value 200) — 503 chars · sample: `Worked example: 1/2 x 1/3 — multiply numerators and denominators separately (5.N`
  * cat[0].clue[3] (value 400) — 507 chars · sample: `Worked example: 1/3 ÷ 4 (5.NF.B.7a). Dividing a fraction by a whole number means`
  * cat[1].clue[4] (value 500) — 506 chars · sample: `Worked example: rectangle area = length x width with fractional sides (5.NF.B.4b`
  * cat[2].clue[1] (value 200) — 501 chars · sample: `Worked example: 2/3 x 9 (5.NF.B.4). Multiply the numerator by the whole number, `
  * cat[2].clue[3] (value 400) — 543 chars · sample: `Worked example: predict whether 5 x 3/4 is greater or less than 5 (5.NF.B.5). Be`
  * cat[2].clue[4] (value 500) — 514 chars · sample: `Worked example: 2/3 ÷ 1/4 (5.NF.B.7). 'Keep, change, flip' (KCF): keep 2/3, chan`
  * cat[3].clue[0] (value 100) — 518 chars · sample: `Worked example: reciprocal of 3/4 is 4/3 (5.NF.B.7). The reciprocal of any fract`
  * ... and 2 more
* **final-explanation-too-verbose** (1)
  * final — 571 chars

### `games/grade-5/07 - Economics in the Western Hemisphere Jeopardy Review.html` — 11 flag(s), 26 items audited

* **explanation-too-verbose** (10)
  * cat[1].clue[0] (value 100) — 555 chars · sample: `A traditional economy is one where economic decisions — what to produce, how to `
  * cat[1].clue[1] (value 200) — 520 chars · sample: `A market economy is one where prices, production, and distribution of goods are `
  * cat[1].clue[2] (value 300) — 542 chars · sample: `In a command economy, the government makes nearly all economic decisions — what `
  * cat[1].clue[3] (value 400) — 539 chars · sample: `A mixed economy combines elements of both market and command (government-control`
  * cat[2].clue[4] (value 500) — 554 chars · sample: `Infrastructure is the basic physical and organizational systems that an economy `
  * cat[3].clue[0] (value 100) — 538 chars · sample: `An import is a good or service that is bought and brought into a country from an`
  * cat[3].clue[3] (value 400) — 576 chars · sample: `A trade agreement is a formal deal between two or more countries that sets the r`
  * cat[3].clue[4] (value 500) — 510 chars · sample: `A tariff is a tax placed by a government on imported goods — making foreign prod`
  * ... and 2 more
* **final-explanation-too-verbose** (1)
  * final — 502 chars

### `games/ap-economics-combined/99 - Cumulative Yearlong Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[1].clue[0] (value 100) — 509 chars · sample: `Market failure occurs when free markets allocate resources inefficiently, produc`
  * cat[1].clue[1] (value 200) — 545 chars · sample: `Supply is the schedule or curve showing quantities producers are willing and abl`
  * cat[1].clue[2] (value 300) — 527 chars · sample: `A negative externality imposes costs on uninvolved third parties (e.g., industri`
  * cat[2].clue[3] (value 400) — 534 chars · sample: `The unemployment rate = (unemployed / labor force) x 100, reported monthly by th`
  * cat[2].clue[4] (value 500) — 528 chars · sample: `Contractionary fiscal policy cuts government spending (G) or raises taxes (T), s`
  * cat[3].clue[0] (value 100) — 504 chars · sample: `Fiscal policy is the government's use of spending (G) and taxation (T) to stabil`
  * cat[4].clue[1] (value 200) — 564 chars · sample: `Comparative advantage — the ability to produce a good at a lower opportunity cos`
  * cat[4].clue[2] (value 300) — 535 chars · sample: `The PPF shows all efficient combinations of two goods an economy can produce giv`
  * ... and 1 more
* **final-explanation-too-verbose** (1)
  * final — 583 chars

### `games/ap-physics-c-mechanics/99 - Cumulative Yearlong Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[0].clue[0] (value 100) — 543 chars · sample: `Velocity is the time derivative of position: v = dx/dt, the foundational calculu`
  * cat[0].clue[2] (value 300) — 535 chars · sample: `Centripetal acceleration is a_c = v^2/r toward the center of a circular path, fu`
  * cat[0].clue[4] (value 500) — 562 chars · sample: `Maximum range for a projectile on level ground occurs at launch angle 45 degrees`
  * cat[1].clue[1] (value 200) — 521 chars · sample: `Newton's third law: forces come in equal-and-opposite pairs acting on different `
  * cat[1].clue[3] (value 400) — 528 chars · sample: `Terminal velocity is the constant maximum speed reached during free-fall with dr`
  * cat[2].clue[0] (value 100) — 566 chars · sample: `The Work-Energy Theorem states W_net = delta KE, the net work done on an object `
  * cat[2].clue[1] (value 200) — 507 chars · sample: `The Impulse-Momentum Theorem states J = delta p, the impulse on an object equals`
  * cat[3].clue[0] (value 100) — 514 chars · sample: `Rotational form of Newton's second law is tau = I*alpha, where tau is net torque`
  * ... and 1 more
* **final-explanation-too-verbose** (1)
  * final — 949 chars

### `games/ap-psychology/05 - Social Psychology and Personality Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[0].clue[0] (value 100) — 534 chars · sample: `Cognitive dissonance (Festinger, 1957) is the psychological discomfort experienc`
  * cat[0].clue[4] (value 500) — 513 chars · sample: `Obedience is compliance with direct orders from an authority figure, even when t`
  * cat[1].clue[1] (value 200) — 515 chars · sample: `Sigmund Freud founded psychoanalytic theory, proposing that behavior is driven b`
  * cat[1].clue[3] (value 400) — 526 chars · sample: `Defense mechanisms are unconscious psychological strategies used by the ego to m`
  * cat[2].clue[1] (value 200) — 525 chars · sample: `The Big Five (OCEAN: Openness, Conscientiousness, Extraversion, Agreeableness, N`
  * cat[2].clue[4] (value 500) — 513 chars · sample: `The foot-in-the-door phenomenon is the tendency to comply with a large request a`
  * cat[3].clue[4] (value 500) — 502 chars · sample: `Deindividuation is the loss of self-awareness and personal responsibility that o`
  * cat[4].clue[0] (value 100) — 514 chars · sample: `Prejudice is an unjustifiable, typically negative, attitude toward a group based`
  * ... and 1 more
* **final-explanation-too-verbose** (1)
  * final — 615 chars

### `games/geometry/01 - Transformations and Symmetry Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (10)
  * cat[0].clue[0] (value 100) — 546 chars · sample: `A translation is a rigid motion (isometry) that slides every point of a figure t`
  * cat[0].clue[1] (value 200) — 504 chars · sample: `A rotation is a rigid motion that turns every point of a figure through a fixed `
  * cat[0].clue[3] (value 400) — 530 chars · sample: `A glide reflection is the composition of a reflection across a line followed by `
  * cat[0].clue[4] (value 500) — 573 chars · sample: `An isometry is any transformation that preserves all distances and angle measure`
  * cat[1].clue[0] (value 100) — 531 chars · sample: `Coordinate notation expresses a transformation as a mapping rule applied to coor`
  * cat[1].clue[1] (value 200) — 507 chars · sample: `The pre-image is the original figure before any transformation is applied. Stand`
  * cat[2].clue[0] (value 100) — 562 chars · sample: `A dilation is a non-isometry transformation centered at a fixed point that multi`
  * cat[2].clue[4] (value 500) — 510 chars · sample: `A reduction is a dilation whose scale factor satisfies 0<k<1, producing a smalle`
  * ... and 2 more

### `games/grade-5/03 - European Exploration and Its Effects Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[1].clue[0] (value 100) — 501 chars · sample: `The Columbian Exchange was the massive transfer of plants, animals, diseases, an`
  * cat[1].clue[1] (value 200) — 541 chars · sample: `Smallpox is a deadly disease caused by the variola virus that produces painful b`
  * cat[1].clue[3] (value 400) — 521 chars · sample: `A missionary is a person sent by a religious organization — usually a church — t`
  * cat[1].clue[4] (value 500) — 507 chars · sample: `Conquistadors were Spanish soldiers and explorers who conquered large parts of t`
  * cat[2].clue[1] (value 200) — 513 chars · sample: `New Spain was the name of Spain's vast colonial empire in the Americas, establis`
  * cat[2].clue[3] (value 400) — 511 chars · sample: `The encomienda system was a Spanish colonial labor arrangement that granted conq`
  * cat[2].clue[4] (value 500) — 516 chars · sample: `A plantation was a large commercial farm, typically in tropical or subtropical r`
  * cat[3].clue[2] (value 300) — 542 chars · sample: `Triangular trade was the three-way trading system linking Europe, West Africa, a`
  * ... and 1 more
* **final-explanation-too-verbose** (1)
  * final — 573 chars

### `games/grade-6-math/99 - Cumulative Yearlong Review Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[0] (value 100) — 562 chars · sample: `Worked example: simplify 12:18 (6.RP.A.3a). GCF of 12 and 18 is 6. Divide both p`
  * cat[1].clue[0] (value 100) — 522 chars · sample: `Worked example: opposite of 8 (6.NS.C.6). Opposite flips the sign: 8 → −8. Commo`
  * cat[1].clue[2] (value 300) — 507 chars · sample: `Worked example: 4/5 ÷ 2/3 (6.NS.A.1). Use KCF: 4/5 ÷ 2/3 = 4/5 x 3/2 = 12/10 = 6`
  * cat[1].clue[3] (value 400) — 501 chars · sample: `Worked example: GCF of 24 and 36 (6.NS.B.4). Prime factorize: 24 = 2³·3; 36 = 2²`
  * cat[2].clue[4] (value 500) — 505 chars · sample: `Worked example: 'no more than 50' as inequality (6.EE.B.8). 'No more than' means`
  * cat[3].clue[3] (value 400) — 505 chars · sample: `Worked example: 2x3x4 box — surface area (6.G.A.4). Three pairs: 2x3 = 6 (top/bo`
  * cat[3].clue[4] (value 500) — 503 chars · sample: `Worked example: trapezoid bases 4 and 6, height 5 (6.G.A.1). Area = (1/2)(b₁ + b`
* **clue-too-terse** (2)
  * cat[0].clue[3] (value 400) — 10 chars · sample: `15% of 80.`
  * cat[1].clue[4] (value 500) — 11 chars · sample: `Sum −5 + 3.`
* **final-explanation-too-verbose** (1)
  * final — 544 chars

### `games/grade-8/99 - Cumulative Yearlong Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[0].clue[4] (value 500) — 523 chars · sample: `Progressive reformers tackled child labor (Keating-Owen Act, 1916), unsafe food `
  * cat[2].clue[1] (value 200) — 501 chars · sample: `The Great Depression caused unprecedented suffering: 15 million unemployed, Dust`
  * cat[2].clue[4] (value 500) — 561 chars · sample: `The Holocaust — the Nazi state's 'Final Solution' decided at Wannsee (January 19`
  * cat[3].clue[2] (value 300) — 515 chars · sample: `Vietnam is the Cold War's most consequential failure for the U.S. — 58,000 Ameri`
  * cat[3].clue[3] (value 400) — 517 chars · sample: `Globalization reshaped the U.S. economy after 1991 — manufacturing moved to lowe`
  * cat[4].clue[0] (value 100) — 501 chars · sample: `The Civil Rights Movement is the Grade 8 capstone — it tests students' ability t`
  * cat[4].clue[1] (value 200) — 506 chars · sample: `Brown v. Board (1954) is the most important civil rights Supreme Court decision `
  * cat[4].clue[3] (value 400) — 544 chars · sample: `Johnson's Great Society simultaneously addressed racial inequality (Civil Rights`
  * ... and 1 more
* **final-explanation-too-verbose** (1)
  * final — 546 chars

### `games/precalculus/07 - Polar Coordinates and Conic Sections Jeopardy Review.html` — 10 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[0].clue[0] (value 100) — 504 chars · sample: `Parabola standard form: (x-h)^2 = 4p(y-k) opens UP if p>0, DOWN if p<0. Vertex (`
  * cat[0].clue[1] (value 200) — 571 chars · sample: `Parabola locus: Set of all points P such that distance from P to focus F equals `
  * cat[1].clue[1] (value 200) — 501 chars · sample: `Eccentricity of ellipse: e = c/a where c = sqrt(a^2 - b^2), a is semi-major axis`
  * cat[1].clue[3] (value 400) — 547 chars · sample: `Ellipse locus: |PF_1| + |PF_2| = 2a for any point P on the ellipse, where F_1 an`
  * cat[2].clue[0] (value 100) — 524 chars · sample: `Horizontal hyperbola: x^2/a^2 - y^2/b^2 = 1 (center origin). Vertices at (+/-a, `
  * cat[2].clue[1] (value 200) — 539 chars · sample: `Hyperbola eccentricity: e = c/a > 1 (since c > a for hyperbola, where c^2 = a^2 `
  * cat[2].clue[4] (value 500) — 536 chars · sample: `Hyperbola locus: ||PF_1| - |PF_2|| = 2a (constant) for any point on the hyperbol`
  * cat[4].clue[0] (value 100) — 515 chars · sample: `(r, θ) where r is distance from origin (the 'pole') and θ is angle from positive`
  * ... and 1 more
* **final-explanation-too-verbose** (1)
  * final — 559 chars

### `games/ap-calc-ab-practice/practice-exam.html` — 10 flag(s), 40 items audited

* **prompt-missing-end-punct** (9)
  * q[5] id=apcalcab-006 · sample: `->0 of [(4 + h)^2 - 16]/h. Its value is:`
  * q[6] id=apcalcab-007 · sample: `(x) = 5x^4 - 3x^2 + 7x - 2, then f'(x) =`
  * q[10] id=apcalcab-011 · sample: `If y = (3x^2 + 1)^5, then dy/dx =`
  * q[18] id=apcalcab-019 · sample: `tion when speed equals 4 (for t > 3) is:`
  * q[27] id=apcalcab-028 · sample: `rtition x = 1, 2, 3, 4. The estimate is:`
  * q[31] id=apcalcab-032 · sample: ` 1), the slope of the solution curve is:`
  * q[33] id=apcalcab-034 · sample: `e 20 years. The decay constant k equals:`
  * q[36] id=apcalcab-037 · sample: `e x-axis (washer method). The volume is:`
  * ... and 1 more
* **prompt-too-terse** (1)
  * q[7] id=apcalcab-008 — 25 chars (<30) · sample: `Find d/dx [x^2 * sin(x)].`

### `games/ap-csa-practice/practice-exam.html` — 10 flag(s), 40 items audited

* **prompt-missing-end-punct** (10)
  * q[1] id=apcsa-002 · sample: `ouble x = 7.8;
int result = (int) x * 2;`
  * q[4] id=apcsa-005 · sample: `r equality?

if (name1 == name2) { ... }`
  * q[5] id=apcsa-006 · sample: `result = Math.pow(2, 5) + Math.sqrt(49);`
  * q[10] id=apcsa-011 · sample: `j != null && obj.getValue() > 0) { ... }`
  * q[11] id=apcsa-012 · sample: `<= 10; i++) {
  System.out.println(i);
}`
  * q[12] id=apcsa-013 · sample: `   sum++;
  }
}
System.out.println(sum);`
  * q[22] id=apcsa-023 · sample: `f (a[i] > m) m = a[i];
  }
  return m;
}`
  * q[27] id=apcsa-028 · sample: `total += n;
}
System.out.println(total);`
  * ... and 2 more

### `games/ap-hug-practice/practice-exam.html` — 10 flag(s), 40 items audited

* **prompt-missing-end-punct** (9)
  * q[12] id=aphug-013 · sample: `the same landscape is best described as:`
  * q[13] id=aphug-014 · sample: `itions into a new hybrid is best called:`
  * q[20] id=aphug-021 · sample: `is the clearest contemporary example of:`
  * q[21] id=aphug-022 · sample: `These boundaries are best classified as:`
  * q[27] id=aphug-028 · sample: `s. This operation is best classified as:`
  * q[30] id=aphug-031 · sample: `goods such as a loaf of bread will have:`
  * q[31] id=aphug-032 · sample: `st city. Bangkok is best described as a:`
  * q[32] id=aphug-033 · sample: `rise. This process is best described as:`
  * ... and 1 more
* **choices-length-variance** (1)
  * q[33] id=aphug-034 — min=13, max=54, ratio=4.2

### `games/ap-italian-practice/practice-exam.html` — 10 flag(s), 40 items audited

* **prompt-too-verbose** (1)
  * q[0] id=apitalian-001 — 352 chars (>300) · sample: `Leggi il breve testo: 'Nella famiglia italiana tradizionale, i nonni vivevano sp`
* **prompt-missing-end-punct** (7)
  * q[4] id=apitalian-005 · sample: `i Maria? Sì, ___ conosco da dieci anni.'`
  * q[12] id=apitalian-013 · sample: `denti ___ le lingue straniere a scuola.'`
  * q[17] id=apitalian-018 · sample: `onimo di Federico Fellini (1960), evoca:`
  * q[19] id=apitalian-020 · sample: `o ___ la cena, mio fratello ___ a casa.'`
  * q[20] id=apitalian-021 · sample: ` 'questione meridionale' si riferisce a:`
  * q[25] id=apitalian-026 · sample: ` che ho ___ stamattina sono buonissime.'`
  * q[38] id=apitalian-039 · sample: `una crisi demografica caratterizzata da:`
* **choices-length-variance** (2)
  * q[6] id=apitalian-007 — min=21, max=96, ratio=4.6
  * q[24] id=apitalian-025 — min=18, max=105, ratio=5.8

### `games/ap-macro-practice/practice-exam.html` — 10 flag(s), 40 items audited

* **prompt-missing-end-punct** (10)
  * q[14] id=apmacro-015 · sample: ` trillion. This economy is experiencing:`
  * q[17] id=apmacro-018 · sample: `D/AS model, this is best represented as:`
  * q[19] id=apmacro-020 · sample: `economy is in long-run equilibrium when:`
  * q[24] id=apmacro-025 · sample: `e in real GDP would most directly cause:`
  * q[26] id=apmacro-027 · sample: ` by households will most directly cause:`
  * q[30] id=apmacro-031 · sample: `is most likely to cause crowding out by:`
  * q[32] id=apmacro-033 · sample: `g real factors constant) will primarily:`
  * q[37] id=apmacro-038 · sample: `n effects on U.S. trade with Mexico are:`
  * ... and 2 more

### `games/grade-5-ela/01 - Reading Literature - Story Elements Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[0].clue[0] (value 100) — 548 chars · sample: `Plot is the chain of events that make up a story, usually shown on a 'story moun`
  * cat[0].clue[3] (value 400) — 506 chars · sample: `Exposition is the opening part of a story where the author introduces who the ch`
  * cat[1].clue[3] (value 400) — 517 chars · sample: `Resolution, also called denouement, is the final section of a story where confli`
  * cat[2].clue[4] (value 500) — 504 chars · sample: `Sometimes setting itself becomes a force against characters - extreme weather, d`
  * cat[3].clue[0] (value 100) — 507 chars · sample: `Conflict is the central problem or struggle that drives a story. Every story has`
  * cat[3].clue[1] (value 200) — 505 chars · sample: `Character vs character is a type of external conflict where the protagonist clas`
  * cat[3].clue[2] (value 300) — 530 chars · sample: `Character vs nature is conflict where the character struggles against the natura`
  * cat[3].clue[4] (value 500) — 538 chars · sample: `Character vs society is conflict where the protagonist challenges rules, expecta`
  * ... and 1 more

### `games/grade-5-math/05 - Coordinate Plane and Patterns Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[1].clue[4] (value 500) — 519 chars · sample: `Worked example: A: 1,2,3 and B: 3,6,9 — form coordinate pairs (5.OA.B.3). Pair x`
  * cat[2].clue[2] (value 300) — 537 chars · sample: `Worked example: (3, 4) is in Quadrant I (5.G.A.1). The four-quadrant plane is di`
  * cat[2].clue[3] (value 400) — 520 chars · sample: `Worked example: move (2, 3) up 4 and right 1 (5.G.A.1). Up 4 increases y: 3 + 4 `
  * cat[2].clue[4] (value 500) — 526 chars · sample: `Worked example: connect (1,1), (5,1), (5,4), (1,4) in order (5.G.B.3). Plot the `
  * cat[3].clue[2] (value 300) — 521 chars · sample: `Worked example: sequence starts at 4 and adds 7 each time (5.OA.B.3). Term 1 = 4`
  * cat[4].clue[2] (value 300) — 516 chars · sample: `Worked example: a square has 4 equal sides and 4 right angles (5.G.B.3). It is B`
  * cat[4].clue[3] (value 400) — 550 chars · sample: `Worked example: a square IS a rectangle (5.G.B.4). A rectangle is defined as a q`
* **explanation-missing-end-punct** (1)
  * cat[4].clue[1] (value 200) · sample: `e parallel sides are called the 'bases.'`
* **final-explanation-too-verbose** (1)
  * final — 575 chars

### `games/grade-5/99 - Cumulative Yearlong Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (8)
  * cat[1].clue[0] (value 100) — 502 chars · sample: `Exploration is traveling to unfamiliar places to gain knowledge, find trade rout`
  * cat[1].clue[3] (value 400) — 510 chars · sample: `The Middle Passage was the forced sea voyage across the Atlantic Ocean that ensl`
  * cat[1].clue[4] (value 500) — 532 chars · sample: `Resistance refers to the many ways colonized and enslaved peoples fought back ag`
  * cat[2].clue[4] (value 500) — 558 chars · sample: `Indigenous rights are the legal and moral claims of Indigenous peoples to their `
  * cat[3].clue[0] (value 100) — 534 chars · sample: `Government is the system of institutions and leaders that makes and enforces rul`
  * cat[3].clue[3] (value 400) — 579 chars · sample: `The Bill of Rights is the first ten amendments to the U.S. Constitution (ratifie`
  * cat[4].clue[1] (value 200) — 520 chars · sample: `A market economy is one where prices and production are determined by buyers and`
  * cat[4].clue[2] (value 300) — 513 chars · sample: `Specialization means focusing on producing the particular goods or services you `
* **final-explanation-too-verbose** (1)
  * final — 546 chars

### `games/grade-6-math/02 - Percents Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[0].clue[2] (value 300) — 545 chars · sample: `Worked example: 25% as a decimal (6.RP.A.3c). Divide by 100: 25 ÷ 100 = 0.25. Or`
  * cat[1].clue[1] (value 200) — 538 chars · sample: `Worked example: 20% of 50 (6.RP.A.3c). Convert 20% to 0.2, multiply: 0.2 x 50 = `
  * cat[1].clue[3] (value 400) — 522 chars · sample: `Worked example: 25% of $60 (6.RP.A.3c). 25% = 1/4, so $60 ÷ 4 = $15. Alternative`
  * cat[3].clue[4] (value 500) — 535 chars · sample: `Worked example: 30% of unknown total = 21 — find total (6.RP.A.3c). 30% x total `
  * cat[4].clue[1] (value 200) — 551 chars · sample: `Worked example: $50 marked up 50% (6.RP.A.3c). Markup: 50% of $50 = $25. New pri`
* **explanation-missing-end-punct** (1)
  * cat[0].clue[2] (value 300) · sample: `se percent literally means 'out of 100.'`
* **clue-too-terse** (3)
  * cat[1].clue[0] (value 100) — 10 chars · sample: `10% of 80.`
  * cat[1].clue[1] (value 200) — 10 chars · sample: `20% of 50.`
  * cat[1].clue[3] (value 400) — 11 chars · sample: `25% of $60.`

### `games/grade-6-math/03 - Operations with Decimals and Fractions Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (9)
  * cat[0].clue[1] (value 200) — 522 chars · sample: `Worked example: 8.5 − 2.78 (6.NS.B.3). Pad with a zero so 8.5 becomes 8.50. Subt`
  * cat[1].clue[1] (value 200) — 537 chars · sample: `Worked example: 5/6 − 1/3 (6.NS.A.1). LCD of 6 and 3 is 6. Convert 1/3 = 2/6. Su`
  * cat[2].clue[0] (value 100) — 517 chars · sample: `Worked example: 3 1/2 as improper fraction (6.NS.A.1 / 5.NF.B.3). Multiply whole`
  * cat[2].clue[1] (value 200) — 523 chars · sample: `Worked example: 9/4 as mixed number (6.NS.A.1). Divide: 9 ÷ 4 = 2 remainder 1. W`
  * cat[2].clue[2] (value 300) — 525 chars · sample: `Worked example: 1 1/2 + 2 1/4 (6.NS.A.1). LCD = 4. Convert: 1 1/2 = 1 2/4. Add w`
  * cat[2].clue[4] (value 500) — 540 chars · sample: `Worked example: 2 1/3 x 3 (6.NS.A.1). Convert mixed: 2 1/3 = 7/3. Multiply: 7/3 `
  * cat[3].clue[1] (value 200) — 564 chars · sample: `Worked example: LCM of 4 and 6 (6.NS.B.4). Multiples of 4: 4,8,12,16,20,24. Mult`
  * cat[4].clue[0] (value 100) — 531 chars · sample: `Worked example: 5 boards x 2.4 m each (6.NS.B.3). 5 x 2.4 = 12 meters. Common st`
  * ... and 1 more

### `games/grade-6-math/06 - Geometry and Statistics Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[1] (value 200) — 545 chars · sample: `Worked example: triangle base 10 m, height 6 m (6.G.A.1). Area = (1/2) x base x `
  * cat[1].clue[1] (value 200) — 516 chars · sample: `Worked example: cube with side 3 — surface area (6.G.A.4). A cube has 6 faces, e`
  * cat[1].clue[3] (value 400) — 519 chars · sample: `Worked example: rectangular prism 2 x 3 x 4 — surface area (6.G.A.4). 6 faces in`
  * cat[2].clue[0] (value 100) — 536 chars · sample: `Worked example: median of 3, 7, 8, 11, 15 (6.SP.A.3 / 6.SP.B.5). Data already in`
  * cat[2].clue[3] (value 400) — 506 chars · sample: `Worked example: range of 12, 15, 7, 22, 10 (6.SP.B.5). Range = max − min = 22 − `
  * cat[3].clue[1] (value 200) — 548 chars · sample: `Worked example: 5-number summary of 2, 5, 6, 8, 10, 13, 15 (6.SP.B.4/B.5). Min =`
  * cat[3].clue[4] (value 500) — 506 chars · sample: `Worked example: IQR with Q1 = 5 and Q3 = 13 (6.SP.B.5). IQR = Q3 − Q1 = 13 − 5 =`
* **explanation-missing-end-punct** (1)
  * cat[4].clue[0] (value 100) · sample: `arithmetic average' or simply 'average.'`
* **final-explanation-too-verbose** (1)
  * final — 511 chars

### `games/grade-7/01 - Native Americans Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (8)
  * cat[2].clue[1] (value 200) — 514 chars · sample: `The Great Plains are an enormous grassland at the heart of North America, and be`
  * cat[2].clue[2] (value 300) — 545 chars · sample: `The Southwest culture area encompasses the desert and canyon lands of present-da`
  * cat[2].clue[3] (value 400) — 558 chars · sample: `The Northwest Coast stretches along the Pacific from northern California to Alas`
  * cat[2].clue[4] (value 500) — 503 chars · sample: `The Arctic region spans Alaska, Canada, and Greenland, where frigid temperatures`
  * cat[4].clue[0] (value 100) — 572 chars · sample: `Cultural continuity means that a people maintains its core traditions, language,`
  * cat[4].clue[1] (value 200) — 508 chars · sample: `A treaty is a formal agreement between sovereign nations — legally binding on al`
  * cat[4].clue[2] (value 300) — 555 chars · sample: `Land stewardship is the idea that humans are caretakers of the natural world, no`
  * cat[4].clue[3] (value 400) — 518 chars · sample: `A Native nation is an Indigenous political community that existed as a self-gove`
* **final-explanation-too-verbose** (1)
  * final — 559 chars

### `games/grade-9-ela/99 - Cumulative Yearlong Jeopardy Review.html` — 9 flag(s), 26 items audited

* **explanation-too-verbose** (8)
  * cat[0].clue[2] (value 300) — 517 chars · sample: `Foreshadowing plants hints of future events to build suspense or thematic resona`
  * cat[0].clue[3] (value 400) — 506 chars · sample: `Paraphrase restates an author's idea in your own words with attribution. Distinc`
  * cat[1].clue[4] (value 500) — 510 chars · sample: `A foil is a character whose traits contrast with another's to illuminate that ch`
  * cat[2].clue[1] (value 200) — 510 chars · sample: `Anaphora repeats a word or phrase at the start of successive clauses. King's eig`
  * cat[2].clue[2] (value 300) — 512 chars · sample: `Logical fallacies are reasoning errors that may seem persuasive but fail logical`
  * cat[3].clue[0] (value 100) — 517 chars · sample: `A thesis is the writer's specific, arguable, defensible position. W.9-10.1a requ`
  * cat[4].clue[2] (value 300) — 503 chars · sample: `Syntax is the arrangement of words in sentences, including order, length, and cl`
  * cat[4].clue[4] (value 500) — 506 chars · sample: `Latin root 'spec/spect' (look, see) generates 'inspect' (look into), 'spectator'`
* **final-explanation-too-verbose** (1)
  * final — 579 chars

### `games/ap-latin-practice/practice-exam.html` — 9 flag(s), 40 items audited

* **choices-length-variance** (3)
  * q[20] id=aplatin-021 — min=22, max=91, ratio=4.1
  * q[33] id=aplatin-034 — min=23, max=101, ratio=4.4
  * q[39] id=aplatin-040 — min=41, max=218, ratio=5.3
* **prompt-missing-end-punct** (3)
  * q[24] id=aplatin-025 · sample: `'urbe capta': '____, the army withdrew.'`
  * q[25] id=aplatin-026 · sample: `statement: 'Caesar dicit hostes venire.'`
  * q[28] id=aplatin-029 · sample: `ditional sentence: 'Si veniat, gaudeam.'`
* **explanation-missing-end-punct** (3)
  * q[24] id=aplatin-025 · sample: `ally, 'once the city had been captured.'`
  * q[26] id=aplatin-027 · sample: `ses 'ne,' negative result uses 'ut non.'`
  * q[30] id=aplatin-031 · sample: ` which gives us 'belle' and 'embellish.'`

### `games/ap-economics-combined/04 - Market Failure and Government Jeopardy Review.html` — 8 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[2] (value 300) — 503 chars · sample: `A Pigouvian tax (named for economist Arthur Pigou) is set equal to the marginal `
  * cat[1].clue[4] (value 500) — 549 chars · sample: `Information failure occurs when buyers or sellers lack accurate information need`
  * cat[2].clue[3] (value 400) — 514 chars · sample: `A corrective subsidy for a positive externality shifts the demand curve (MPB) up`
  * cat[3].clue[3] (value 400) — 504 chars · sample: `Patent protection grants inventors a temporary monopoly right (20 years in the U`
  * cat[4].clue[0] (value 100) — 518 chars · sample: `A pollution externality is a negative externality where the production process i`
  * cat[4].clue[2] (value 300) — 524 chars · sample: `Education produces positive externalities: beyond private benefits to the studen`
  * cat[4].clue[4] (value 500) — 517 chars · sample: `Environmental regulation uses government rules — emission standards, technology `
* **final-explanation-too-verbose** (1)
  * final — 509 chars

### `games/global-9/01 - Development of Civilization Jeopardy Review.html` — 8 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[1].clue[1] (value 200) — 520 chars · sample: `The Mandate of Heaven (Tianming) was the Chinese belief — first formally articul`
  * cat[3].clue[0] (value 100) — 544 chars · sample: `The Indus Valley Civilization (c. 2600–1900 BCE), centered in present-day Pakist`
  * cat[3].clue[1] (value 200) — 520 chars · sample: `The Nile River — the world's longest river at 4,135 miles — was the lifeblood of`
  * cat[3].clue[2] (value 300) — 502 chars · sample: `A civilization is a complex, organized society characterized by cities, speciali`
  * cat[3].clue[4] (value 500) — 565 chars · sample: `Harappa (in modern Pakistan) and Mohenjo-Daro (also in Pakistan, 400 miles south`
  * cat[4].clue[3] (value 400) — 528 chars · sample: `Historians identify eight features that define a civilization: cities, organized`
  * cat[4].clue[4] (value 500) — 519 chars · sample: `China's first civilizations arose in the Yellow River (Huang He) Valley around 2`
* **final-explanation-too-verbose** (1)
  * final — 539 chars

### `games/grade-11-ela/04 - Reading Informational - Rhetoric Tone Purpose Jeopardy Review.html` — 8 flag(s), 26 items audited

* **explanation-too-verbose** (8)
  * cat[0].clue[0] (value 100) — 526 chars · sample: `Indignant tone conveys righteous anger at wrongdoing. Frederick Douglass's 'What`
  * cat[0].clue[2] (value 300) — 517 chars · sample: `Resolute tone shows firm, unwavering commitment without anger or hesitation. Tho`
  * cat[0].clue[3] (value 400) — 522 chars · sample: `Satirical tone uses irony, exaggeration, and ridicule to expose folly. Mark Twai`
  * cat[1].clue[0] (value 100) — 532 chars · sample: `Author's purpose can be to inform, persuade, entertain, or express. Frederick Do`
  * cat[1].clue[3] (value 400) — 547 chars · sample: `Expressive purpose centers the writer's personal perspective, feelings, or exper`
  * cat[1].clue[4] (value 500) — 535 chars · sample: `Transcendentalist writers (Emerson, Thoreau, Margaret Fuller) aimed less at pers`
  * cat[3].clue[0] (value 100) — 525 chars · sample: `Motivating to action is a subtype of persuasion focused on producing behavior, n`
  * cat[3].clue[4] (value 500) — 505 chars · sample: `Constraints (Bitzer, 1968) are factors that limit what the speaker can say or do`

### `games/grade-6-math/04 - Rational Numbers Jeopardy Review.html` — 8 flag(s), 26 items audited

* **explanation-too-verbose** (6)
  * cat[0].clue[0] (value 100) — 525 chars · sample: `Worked example: opposite of −7 (6.NS.C.6). The OPPOSITE flips the sign: −7 → +7.`
  * cat[0].clue[2] (value 300) — 566 chars · sample: `Worked example: 4 − (−3) (6.NS.C.5). Subtracting a negative is the same as addin`
  * cat[0].clue[3] (value 400) — 548 chars · sample: `Worked example: (−4) x (−3) (6.NS.C). Multiplying two negatives gives a POSITIVE`
  * cat[1].clue[0] (value 100) — 501 chars · sample: `Worked example: −5 is 5 units LEFT of 0 (6.NS.C.6). On a number line, negatives `
  * cat[4].clue[0] (value 100) — 511 chars · sample: `Worked example: deposit $50 into account with balance −$30 (6.NS.C.5). New balan`
  * cat[4].clue[2] (value 300) — 542 chars · sample: `Worked example: absolute value of −12 (6.NS.C.7c). |−12| = 12. Absolute value st`
* **clue-too-terse** (1)
  * cat[1].clue[1] (value 200) — 11 chars · sample: `Sum −3 + 5.`
* **final-explanation-too-verbose** (1)
  * final — 502 chars

### `games/grade-6-math/05 - Expressions and Equations Jeopardy Review.html` — 8 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[4] (value 500) — 505 chars · sample: `Worked example: 7 + x = 7 + 3 (6.EE.B.7). The right side simplifies to 10: 7 + x`
  * cat[1].clue[1] (value 200) — 570 chars · sample: `Worked example: 'a number n plus 7' as expression (6.EE.A.2a). 'Plus 7' = add 7,`
  * cat[1].clue[3] (value 400) — 528 chars · sample: `Worked example: 4x − 3 at x = 2 (6.EE.A.2c). Substitute x = 2: 4(2) − 3 = 8 − 3 `
  * cat[1].clue[4] (value 500) — 551 chars · sample: `Worked example: distributive property: 3(x + 5) (6.EE.A.3). Distribute 3 to each`
  * cat[2].clue[1] (value 200) — 575 chars · sample: `Worked example: (2 + 3) + 4 = 2 + (3 + 4) (6.EE.A.3). This is the ASSOCIATIVE pr`
  * cat[3].clue[3] (value 400) — 517 chars · sample: `Worked example: which values satisfy x < 4 from {2, 3, 4, 5} (6.EE.B.8). Test ea`
  * cat[4].clue[0] (value 100) — 503 chars · sample: `Worked example: 'I have x cookies, get 5 more, total 12' (6.EE.B.7). Translate: `
* **final-explanation-too-verbose** (1)
  * final — 509 chars

### `games/grade-8/09 - Domestic Politics and Reform Jeopardy Review.html` — 8 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[1] (value 200) — 540 chars · sample: `In Brown v. Board of Education (1954), the Supreme Court under Chief Justice Ear`
  * cat[0].clue[4] (value 500) — 518 chars · sample: `The Civil Rights Act of 1964 prohibited discrimination in hotels, restaurants, a`
  * cat[1].clue[3] (value 400) — 531 chars · sample: `On September 4, 1957, Arkansas Governor Faubus called out the National Guard to `
  * cat[2].clue[2] (value 300) — 513 chars · sample: `Cesar Chavez (1927–1993) co-founded the National Farm Workers Association (later`
  * cat[4].clue[2] (value 300) — 515 chars · sample: `Modern American conservatism grew from Barry Goldwater's 1964 campaign through t`
  * cat[4].clue[3] (value 400) — 520 chars · sample: `Reaganomics (supply-side economics) rested on the theory that tax cuts for corpo`
  * cat[4].clue[4] (value 500) — 526 chars · sample: `Civil liberties have been contested throughout U.S. history: the Espionage Act (`
* **final-explanation-too-verbose** (1)
  * final — 613 chars

### `games/grade-9-ela/05 - Writing - Argument Essay Jeopardy Review.html` — 8 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[0] (value 100) — 510 chars · sample: `A thesis is the writer's specific, arguable, defensible position. W.9-10.1a requ`
  * cat[1].clue[2] (value 300) — 501 chars · sample: `Refutation disproves the opposing view through evidence, logical analysis, or ex`
  * cat[1].clue[4] (value 500) — 526 chars · sample: `Strategic concession-then-counter strengthens ethos: the writer appears fair, th`
  * cat[2].clue[1] (value 200) — 509 chars · sample: `Signal phrases (a.k.a. tags or attributions) introduce quotations with context: `
  * cat[2].clue[2] (value 300) — 507 chars · sample: `Commentary (analysis) follows evidence with the writer's interpretation of its m`
  * cat[3].clue[0] (value 100) — 518 chars · sample: `Addition transitions ('furthermore,' 'moreover,' 'additionally,' 'in addition,' `
  * cat[3].clue[4] (value 500) — 503 chars · sample: `Linked transitions (bridge sentences) create flow by referencing the previous pa`
* **final-explanation-too-verbose** (1)
  * final — 511 chars

### `games/ap-german-practice/practice-exam.html` — 8 flag(s), 40 items audited

* **choices-length-variance** (4)
  * q[6] id=apgerman-007 — min=16, max=67, ratio=4.2
  * q[15] id=apgerman-016 — min=10, max=58, ratio=5.8
  * q[28] id=apgerman-029 — min=12, max=68, ratio=5.7
  * q[36] id=apgerman-037 — min=30, max=128, ratio=4.3
* **prompt-missing-end-punct** (4)
  * q[10] id=apgerman-011 · sample: ` Hannover Messe 2011 — bezieht sich auf:`
  * q[14] id=apgerman-015 · sample: `Die höchste deutsche Fußball-Liga heißt:`
  * q[29] id=apgerman-030 · sample: `in Weimar, wurde 1933 geschlossen, weil:`
  * q[34] id=apgerman-035 · sample: `das.'"

Dieses Ereignis ist bekannt als:`

### `games/ap-physics-2-practice/practice-exam.html` — 8 flag(s), 40 items audited

* **prompt-missing-end-punct** (7)
  * q[9] id=apphys2-010 · sample: ` change in the gas's internal energy is:`
  * q[11] id=apphys2-012 · sample: `r stays the same, the new force becomes:`
  * q[27] id=apphys2-028 · sample: `e induced current in the loop will flow:`
  * q[28] id=apphys2-029 · sample: `sured from the normal to the mirror, is:`
  * q[30] id=apphys2-031 · sample: `reflection can occur when light travels:`
  * q[33] id=apphys2-034 · sample: `ng filter. The transmitted intensity is:`
  * q[37] id=apphys2-038 · sample: `al lines of emitted light arise because:`
* **choices-length-variance** (1)
  * q[36] id=apphys2-037 — min=15, max=71, ratio=4.7

### `games/grade-5-math-practice/practice-exam.html` — 8 flag(s), 30 items audited

* **prompt-too-terse** (8)
  * q[6] id=g5math-007 — 18 chars (<30) · sample: `What is 3.6 x 100?`
  * q[7] id=g5math-008 — 27 chars (<30) · sample: `What is 47.2 divided by 10?`
  * q[11] id=g5math-012 — 20 chars (<30) · sample: `What is 12.34 + 5.7?`
  * q[13] id=g5math-014 — 18 chars (<30) · sample: `What is 1/2 + 1/3?`
  * q[14] id=g5math-015 — 18 chars (<30) · sample: `What is 3/4 - 1/6?`
  * q[15] id=g5math-016 — 16 chars (<30) · sample: `What is 2/5 x 3?`
  * q[17] id=g5math-018 — 25 chars (<30) · sample: `What is 1/4 divided by 3?`
  * q[18] id=g5math-019 — 25 chars (<30) · sample: `What is 6 divided by 1/3?`

### `games/ap-computer-science-principles/99 - Cumulative Yearlong Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (6)
  * cat[0].clue[1] (value 200) — 510 chars · sample: `Procedures are essential — the Create PT rubric awards a point specifically for `
  * cat[0].clue[4] (value 500) — 539 chars · sample: `Pair programming (formalized by Kent Beck in Extreme Programming, 1999) has one `
  * cat[1].clue[1] (value 200) — 526 chars · sample: `Lossy compression (JPEG, MP3, MPEG) gets much higher compression ratios by disca`
  * cat[1].clue[4] (value 500) — 520 chars · sample: `Data bias arises when training data does not represent the deployment population`
  * cat[4].clue[3] (value 400) — 540 chars · sample: `Algorithmic bias is unfair outcome that comes from data, design, or deployment. `
  * cat[4].clue[4] (value 500) — 508 chars · sample: `MFA combines factors: something you know (password), have (phone/key), are (biom`
* **final-explanation-too-verbose** (1)
  * final — 595 chars

### `games/ap-world-history/09 - Unit 9 Globalization Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (6)
  * cat[0].clue[1] (value 200) — 507 chars · sample: `Outsourcing—relocating manufacturing or services to countries with cheaper labor`
  * cat[2].clue[4] (value 500) — 506 chars · sample: `The Universal Declaration of Human Rights (UDHR), adopted by the UN General Asse`
  * cat[3].clue[3] (value 400) — 515 chars · sample: `The digital revolution (c. 1970s–present) transformed economies, communication, `
  * cat[3].clue[4] (value 500) — 503 chars · sample: `The roughly 80 new states that emerged from decolonization (1945–1975) inherited`
  * cat[4].clue[1] (value 200) — 516 chars · sample: `HIV/AIDS, first identified in 1981, had infected ~75 million people and killed ~`
  * cat[4].clue[4] (value 500) — 501 chars · sample: `Globalization's intensified human movement accelerated disease transmission: SAR`
* **final-explanation-too-verbose** (1)
  * final — 526 chars

### `games/grade-10-ela/04 - Reading Informational - Rhetoric Tone Purpose Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[0] (value 100) — 522 chars · sample: `Restrained tone conveys intense feeling through deliberate understatement. Wiese`
  * cat[0].clue[1] (value 200) — 517 chars · sample: `Elegiac tone laments loss, like Antony's 'O mighty Caesar! Dost thou lie so low?`
  * cat[1].clue[1] (value 200) — 525 chars · sample: `Informational/expository purpose is to explain or convey knowledge clearly witho`
  * cat[1].clue[2] (value 300) — 515 chars · sample: `Aristotle's Poetics defines tragedy's purpose as catharsis: the purging of pity `
  * cat[1].clue[3] (value 400) — 540 chars · sample: `Expressive purpose centers the writer's perspective, feelings, or experience, of`
  * cat[1].clue[4] (value 500) — 504 chars · sample: `Advocating policy is a specific persuasive purpose: arguing for or against a cou`
  * cat[2].clue[3] (value 400) — 502 chars · sample: `Personalization makes abstract claims concrete by anchoring them in specific peo`

### `games/grade-11-ela/01 - Reading Literature - Plot Setting Character Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[0] (value 100) — 571 chars · sample: `F. Scott Fitzgerald opens The Great Gatsby (1925) with Nick Carraway's expositio`
  * cat[0].clue[1] (value 200) — 533 chars · sample: `Fitzgerald positions Myrtle's death in Chapter 7 as the climax: Daisy strikes My`
  * cat[0].clue[2] (value 300) — 545 chars · sample: `Fitzgerald's falling action accelerates after Myrtle's death: Wilson is led to b`
  * cat[0].clue[3] (value 400) — 509 chars · sample: `Fitzgerald's denouement (literally 'untying') closes the novel with Gatsby's nea`
  * cat[2].clue[3] (value 400) — 510 chars · sample: `Miller's Proctor tears his coerced confession with 'Because it is my name! Becau`
  * cat[2].clue[4] (value 500) — 539 chars · sample: `Unreliable narrators have compromised credibility due to bias, age, moral failin`
  * cat[3].clue[4] (value 500) — 527 chars · sample: `Twain makes the Mississippi River both literal escape route and symbol of freedo`

### `games/grade-11-ela/02 - Reading Literature - Theme Craft Point of View Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[0] (value 100) — 529 chars · sample: `Fitzgerald argues the American Dream is a national myth that destroys its dreame`
  * cat[0].clue[3] (value 400) — 512 chars · sample: `Hurston traces Janie's three marriages as a path to selfhood. Her grandmother's `
  * cat[1].clue[0] (value 100) — 522 chars · sample: `Fitzgerald uses first-person retrospective narration in The Great Gatsby: Nick w`
  * cat[1].clue[3] (value 400) — 532 chars · sample: `Drama eliminates narration; the audience sees and hears multiple characters' per`
  * cat[2].clue[0] (value 100) — 503 chars · sample: `Fitzgerald threads color through Gatsby: Gatsby's hope (green), the wealth and c`
  * cat[2].clue[2] (value 300) — 508 chars · sample: `Hawthorne's narrator in The Scarlet Letter is editorial omniscient: he comments `
  * cat[3].clue[3] (value 400) — 519 chars · sample: `Hurston pairs African American Vernacular English (AAVE) in dialogue ('Ah ain't `

### `games/grade-11-ela/05 - Writing - Argument Essay Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[0].clue[0] (value 100) — 572 chars · sample: `A thesis is the writer's specific, arguable, defensible position. W.11-12.1a req`
  * cat[0].clue[3] (value 400) — 503 chars · sample: `W.11-12.1a explicitly requires introducing 'precise, knowledgeable claim(s).' Th`
  * cat[0].clue[4] (value 500) — 519 chars · sample: `Vague theses fail because they neither argue nor specify. Strong theses name the`
  * cat[1].clue[3] (value 400) — 536 chars · sample: `Refutation disproves the opposing view through evidence, logical analysis, or fa`
  * cat[2].clue[4] (value 500) — 513 chars · sample: `Quotation integration weaves short quotations seamlessly into the writer's sente`
  * cat[3].clue[0] (value 100) — 523 chars · sample: `Addition transitions ('furthermore,' 'moreover,' 'additionally,' 'in addition,' `
  * cat[3].clue[2] (value 300) — 506 chars · sample: `Counterclaim transitions signal the shift from the writer's claim to the opposin`

### `games/grade-8/07 - Foreign Policy Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (6)
  * cat[2].clue[1] (value 200) — 510 chars · sample: `The U.S. escalated involvement in Vietnam under Presidents Kennedy and Johnson, `
  * cat[2].clue[3] (value 400) — 502 chars · sample: `When U.S. U-2 spy planes photographed Soviet missile sites under construction in`
  * cat[4].clue[1] (value 200) — 503 chars · sample: `On September 11, 2001, 19 al-Qaeda hijackers took over four airliners. Two hit t`
  * cat[4].clue[2] (value 300) — 514 chars · sample: `The War on Terror began with the October 2001 invasion of Afghanistan to destroy`
  * cat[4].clue[3] (value 400) — 525 chars · sample: `The 2008 financial crisis demonstrated economic interdependence: a U.S. housing `
  * cat[4].clue[4] (value 500) — 509 chars · sample: `Cybersecurity emerged as a major national security concern in the early 21st cen`
* **final-explanation-too-verbose** (1)
  * final — 520 chars

### `games/grade-8/08 - Demographic Change Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (7)
  * cat[2].clue[1] (value 200) — 545 chars · sample: `Urban renewal programs, funded by the Housing Act of 1949, bulldozed over 400,00`
  * cat[2].clue[2] (value 300) — 538 chars · sample: `The Home Owners' Loan Corporation (1933) and FHA created neighborhood rating map`
  * cat[2].clue[4] (value 500) — 527 chars · sample: `Public transportation shaped urban growth before the car era — New York City's s`
  * cat[3].clue[2] (value 300) — 510 chars · sample: `President Nixon created the EPA by executive reorganization in December 1970, co`
  * cat[3].clue[4] (value 500) — 528 chars · sample: `The United States has historically consumed natural resources at rates far excee`
  * cat[4].clue[2] (value 300) — 505 chars · sample: `Cultural pluralism — the 'salad bowl' model — contrasts with the 'melting pot' i`
  * cat[4].clue[3] (value 400) — 550 chars · sample: `Bilingual education expanded after the Bilingual Education Act (1968), which fun`

### `games/precalculus/02 - Polynomial and Rational Functions Jeopardy Review.html` — 7 flag(s), 26 items audited

* **explanation-too-verbose** (6)
  * cat[1].clue[2] (value 300) — 506 chars · sample: `Continuity for IVT: The function must be continuous on the entire closed interva`
  * cat[3].clue[0] (value 100) — 531 chars · sample: `Imaginary unit i: Defined by i^2=-1, equivalently i=sqrt(-1). Powers cycle: i^1=`
  * cat[3].clue[3] (value 400) — 512 chars · sample: `Fundamental Theorem of Algebra (Gauss, 1799): Every degree-n polynomial with com`
  * cat[3].clue[4] (value 500) — 520 chars · sample: `Solve x^2+9=0: x^2=-9, x=+/-sqrt(-9)=+/-sqrt(9)*sqrt(-1)=+/-3i. The two roots ar`
  * cat[4].clue[0] (value 100) — 509 chars · sample: `Intermediate Value Theorem (IVT): If f is continuous on [a,b] and N is between f`
  * cat[4].clue[4] (value 500) — 522 chars · sample: `Bisection method: Given continuous f with f(a)f(b)<0, repeatedly bisect [a,b]: c`
* **final-explanation-too-verbose** (1)
  * final — 580 chars

### `games/ap-physics-c-em-practice/practice-exam.html` — 7 flag(s), 35 items audited

* **prompt-missing-end-punct** (7)
  * q[22] id=apphyscem-023 · sample: ` loop of radius R carrying current I is:`
  * q[25] id=apphyscem-026 · sample: ` magnitude of the torque on the loop is:`
  * q[27] id=apphyscem-028 · sample: `xis, is found via ∮B·dl = μ₀I_enc to be:`
  * q[29] id=apphyscem-030 · sample: `'s law, the induced current in the loop:`
  * q[31] id=apphyscem-032 · sample: `n the magnetic field of the inductor is:`
  * q[33] id=apphyscem-034 · sample: `uctance M between them is approximately:`
  * q[34] id=apphyscem-035 · sample: ` The primary physical motivation was to:`

### `games/economics/01 - Economic Decision-Making Jeopardy Review.html` — 6 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[1].clue[3] (value 400) — 524 chars · sample: `Consumer choice theory explains how rational buyers maximize satisfaction subjec`
  * cat[2].clue[1] (value 200) — 513 chars · sample: `A budget constraint is the set of all combinations of goods a consumer can purch`
  * cat[3].clue[1] (value 200) — 506 chars · sample: `The circular flow model illustrates how households supply factors of production `
  * cat[4].clue[2] (value 300) — 522 chars · sample: `Marginal utility is the additional satisfaction gained from consuming one more u`
  * cat[4].clue[4] (value 500) — 508 chars · sample: `Cost-benefit analysis is a systematic decision tool that monetizes all expected `
* **final-explanation-too-verbose** (1)
  * final — 510 chars

### `games/grade-5/04 - Geography in the Western Hemisphere Jeopardy Review.html` — 6 flag(s), 26 items audited

* **explanation-too-verbose** (6)
  * cat[1].clue[4] (value 500) — 504 chars · sample: `The Caribbean Sea is a warm, tropical body of water between the Gulf of Mexico, `
  * cat[2].clue[2] (value 300) — 514 chars · sample: `A rainforest is a dense, tropical forest that receives at least 80 inches of rai`
  * cat[2].clue[3] (value 400) — 517 chars · sample: `A grassland is a large, open area dominated by grasses with few trees — called p`
  * cat[2].clue[4] (value 500) — 550 chars · sample: `A desert is any region that receives less than 10 inches of precipitation per ye`
  * cat[3].clue[4] (value 500) — 528 chars · sample: `A transportation corridor is a natural or human-made route — a river valley, mou`
  * cat[4].clue[4] (value 500) — 522 chars · sample: `Conservation is the careful use and protection of natural resources to prevent t`

### `games/ap-physics-1-practice/practice-exam.html` — 6 flag(s), 40 items audited

* **prompt-missing-end-punct** (5)
  * q[4] id=apphys1-005 · sample: `m t = 0 to some later time t represents:`
  * q[34] id=apphys1-035 · sample: `compressible fluid, the pressure change:`
  * q[37] id=apphys1-038 · sample: `mics, the added heat Q goes entirely to:`
  * q[38] id=apphys1-039 · sample: `ectric force between them is closest to:`
  * q[39] id=apphys1-040 · sample: ` is taken away. The sphere ends up with:`
* **explanation-missing-end-punct** (1)
  * q[8] id=apphys1-009 · sample: `vier: T = m₂(g - a) = 3.0(8.0) = 24 N. ✓`

### `games/ap-physics-c-mech-practice/practice-exam.html` — 6 flag(s), 35 items audited

* **prompt-missing-end-punct** (6)
  * q[22] id=apphyscm-023 · sample: `g friction, her new angular velocity is:`
  * q[29] id=apphyscm-030 · sample: `n the lightly damped limit) occurs when:`
  * q[30] id=apphyscm-031 · sample: `ravitational force between them becomes:`
  * q[32] id=apphyscm-033 · sample: `d T and orbital radius r are related by:`
  * q[33] id=apphyscm-034 · sample: ` the radial gravitational force on m is:`
  * q[34] id=apphyscm-035 · sample: `gy to zero. The resulting expression is:`

### `games/ap-stats-practice/practice-exam.html` — 6 flag(s), 40 items audited

* **prompt-missing-end-punct** (6)
  * q[9] id=apstats-010 · sample: `is sampling method is best described as:`
  * q[12] id=apstats-013 · sample: `The biggest concern with this design is:`
  * q[13] id=apstats-014 · sample: ` placebo. This design feature is called:`
  * q[20] id=apstats-021 · sample: ` us that, for large enough sample sizes:`
  * q[27] id=apstats-028 · sample: ` a true null hypothesis. This describes:`
  * q[33] id=apstats-034 · sample: `ution with small degrees of freedom has:`

### `games/ap-microeconomics/06 - Unit 6 Market Failure and Role of Government Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[4].clue[0] (value 100) — 509 chars · sample: `Asymmetric information occurs when one party in a transaction has more or better`
  * cat[4].clue[1] (value 200) — 533 chars · sample: `Tradable pollution permits (cap-and-trade) set an aggregate emissions cap, distr`
  * cat[4].clue[2] (value 300) — 533 chars · sample: `The tragedy of the commons is the overuse or depletion of a common resource beca`
  * cat[4].clue[3] (value 400) — 529 chars · sample: `Information failure (asymmetric information) occurs when one party to a transact`
  * cat[4].clue[4] (value 500) — 506 chars · sample: `A patent grants an inventor a temporary legal monopoly (20 years under U.S. law)`

### `games/ap-microeconomics/99 - Cumulative Yearlong Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[0].clue[4] (value 500) — 519 chars · sample: `Comparative advantage is the basis for mutually beneficial trade: produce the go`
  * cat[1].clue[2] (value 300) — 527 chars · sample: `Price discrimination means charging different prices to different consumers for `
  * cat[3].clue[3] (value 400) — 512 chars · sample: `Supply shifters are non-price factors moving the entire supply curve (input Pric`
  * cat[4].clue[1] (value 200) — 519 chars · sample: `Market failure is any situation where private markets fail to maximize total sur`
  * cat[4].clue[4] (value 500) — 505 chars · sample: `A negative externality imposes costs on uninvolved third parties (factory pollut`

### `games/ap-psychology/04 - Development and Learning Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[1].clue[3] (value 400) — 515 chars · sample: `Maturation is the biologically programmed unfolding of developmental sequences o`
  * cat[1].clue[4] (value 500) — 531 chars · sample: `A critical period is a biologically determined window during which specific expe`
  * cat[3].clue[4] (value 500) — 530 chars · sample: `Operant conditioning (B.F. Skinner) is learning in which behavior is strengthene`
  * cat[4].clue[4] (value 500) — 509 chars · sample: `Erik Erikson proposed eight psychosocial stages spanning the entire lifespan, ea`
* **final-explanation-too-verbose** (1)
  * final — 546 chars

### `games/ap-world-history/08 - Unit 8 Cold War and Decolonization Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[2].clue[0] (value 100) — 513 chars · sample: `Containment—articulated by diplomat George Kennan in his 1946 Long Telegram and `
  * cat[3].clue[0] (value 100) — 501 chars · sample: `Hosted by Indonesia in April 1955, the Bandung Conference gathered leaders from `
  * cat[4].clue[1] (value 200) — 526 chars · sample: `The Green Revolution (1940s–1970s) introduced high-yield hybrid wheat and rice v`
  * cat[4].clue[4] (value 500) — 515 chars · sample: `Détente (c. 1969–1979) eased Cold War tensions through negotiated agreements: SA`
* **final-explanation-too-verbose** (1)
  * final — 524 chars

### `games/geometry/04 - Right Triangles and Trigonometry Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[0].clue[0] (value 100) — 580 chars · sample: `The hypotenuse is the side of a right triangle opposite the right angle — always`
  * cat[0].clue[2] (value 300) — 538 chars · sample: `The Pythagorean Theorem states that in a right triangle with legs a, b and hypot`
  * cat[1].clue[2] (value 300) — 512 chars · sample: `The tangent of an acute angle in a right triangle equals opposite over adjacent:`
  * cat[2].clue[2] (value 300) — 520 chars · sample: `A radical side length is an exact length expressed using a square-root symbol (e`
  * cat[3].clue[1] (value 200) — 519 chars · sample: `The angle of depression is measured downward from a horizontal line of sight to `

### `games/geometry/06 - Coordinate Geometry Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[1].clue[0] (value 100) — 546 chars · sample: `The slope formula m=(y₂-y₁)/(x₂-x₁) gives the rate of vertical change per unit o`
  * cat[2].clue[0] (value 100) — 549 chars · sample: `A coordinate proof uses coordinates and algebraic formulas (distance, midpoint, `
  * cat[2].clue[1] (value 200) — 521 chars · sample: `A classified quadrilateral is the result of a coordinate proof identifying a fou`
  * cat[2].clue[2] (value 300) — 520 chars · sample: `Diagonal properties are key classification evidence in coordinate proofs (G-GPE.`
  * cat[4].clue[0] (value 100) — 501 chars · sample: `A locus is the set of all points satisfying a given geometric condition (G-GPE).`

### `games/geometry/99 - Cumulative Yearlong Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[0].clue[0] (value 100) — 555 chars · sample: `A rigid-motion proof argues that two figures are congruent by exhibiting a speci`
  * cat[0].clue[2] (value 300) — 528 chars · sample: `Parallel-line angle relationships — alternate interior (congruent), correspondin`
  * cat[0].clue[4] (value 500) — 521 chars · sample: `A logical justification is the reason cited at each step of a two-column proof —`
  * cat[1].clue[4] (value 500) — 550 chars · sample: `Indirect measurement uses similar triangles, trig ratios, or geometric relations`
  * cat[4].clue[4] (value 500) — 509 chars · sample: `Counterexample reasoning disproves a universal statement by exhibiting one speci`

### `games/grade-10-ela/01 - Reading Literature - Plot Setting Character Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[1].clue[0] (value 100) — 501 chars · sample: `William Golding's Lord of the Flies (1954) uses the deserted Pacific island as s`
  * cat[2].clue[0] (value 100) — 504 chars · sample: `Direct characterization explicitly states a character's traits through narration`
  * cat[3].clue[0] (value 100) — 502 chars · sample: `Golding makes Piggy's glasses the literal instrument of fire-making (focusing su`
  * cat[4].clue[4] (value 500) — 510 chars · sample: `Chinua Achebe's Things Fall Apart (1958) pairs Okonkwo (driven by fear of his fa`
* **final-explanation-too-verbose** (1)
  * final — 524 chars

### `games/grade-10-ela/02 - Reading Literature - Theme Craft Point of View Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[1].clue[0] (value 100) — 502 chars · sample: `The Shakespearean (English) sonnet has 14 lines of iambic pentameter rhyming aba`
  * cat[2].clue[0] (value 100) — 515 chars · sample: `Salinger uses first-person narration in Catcher: 16-year-old Holden tells his st`
  * cat[3].clue[1] (value 200) — 522 chars · sample: `Hyperbole is intentional exaggeration for emphasis or effect. Stanley's 'I am th`
  * cat[3].clue[4] (value 500) — 551 chars · sample: `Metapoetics is poetry that refers to itself or to the act of writing. Sonnet 18'`
* **final-explanation-too-verbose** (1)
  * final — 515 chars

### `games/grade-5-math/99 - Cumulative Yearlong Review Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[0].clue[4] (value 500) — 520 chars · sample: `Worked example: 'two and seventeen thousandths' = 2.017 (5.NBT.A.3a). Whole part`
  * cat[1].clue[1] (value 200) — 523 chars · sample: `Worked example: 2 feet to inches (5.MD.A.1). Multiply by 12 (inches per foot): 2`
  * cat[1].clue[3] (value 400) — 518 chars · sample: `Worked example: 4/5 x 1/2 (5.NF.B.4). Multiply tops, multiply bottoms: (4 x 1)/(`
  * cat[1].clue[4] (value 500) — 506 chars · sample: `Worked example: 6 ÷ 2/3 (5.NF.B.7). Use KCF: keep 6, change ÷ to x, flip 2/3 to `
  * cat[2].clue[3] (value 400) — 518 chars · sample: `Worked example: 3 1/4 − 1 3/4 (5.NF.A.1). Common denominator is already 4. Subtr`

### `games/grade-6-math/01 - Ratios and Proportional Relationships Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[0].clue[1] (value 200) — 506 chars · sample: `Worked example: 4:6 divided by 2 (6.RP.A.3a). Divide BOTH parts by 2: 4 ÷ 2 = 2 `
  * cat[0].clue[2] (value 300) — 514 chars · sample: `Worked example: recipe uses 2 cups flour for every 3 cups sugar; given 9 cups su`
  * cat[1].clue[3] (value 400) — 504 chars · sample: `Worked example: compare $4 for 8 oz vs. $5 for 12 oz (6.RP.A.3b). Compute each u`
  * cat[4].clue[1] (value 200) — 526 chars · sample: `Worked example: every proportional relationship passes through the ORIGIN (0, 0)`
  * cat[4].clue[2] (value 300) — 516 chars · sample: `Worked example: (1, 6), (2, 12), (3, 18) — find constant of proportionality (6.R`

### `games/grade-6/07 - Interactions Across the Eastern Hemisphere Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[1].clue[2] (value 300) — 505 chars · sample: `Monsoon winds are seasonal reversals of wind over the Indian Ocean — blowing nor`
  * cat[3].clue[3] (value 400) — 522 chars · sample: `The Black Death was the most devastating pandemic in recorded history — a buboni`
  * cat[3].clue[4] (value 500) — 520 chars · sample: `A pandemic is a disease outbreak that spreads across a very large region — multi`
  * cat[4].clue[0] (value 100) — 510 chars · sample: `Ibn Battuta (1304–1368 CE) was a Moroccan Muslim scholar who traveled approximat`
* **final-explanation-too-verbose** (1)
  * final — 611 chars

### `games/grade-6/99 - Cumulative Yearlong Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (5)
  * cat[0].clue[4] (value 500) — 513 chars · sample: `The Neolithic Revolution (beginning around 10,000 BCE) was the world-changing sh`
  * cat[1].clue[4] (value 500) — 536 chars · sample: `The Mandate of Heaven was the Chinese belief that heaven (tian) granted rulers t`
  * cat[2].clue[3] (value 400) — 505 chars · sample: `Hinduism is the world's oldest living religion, rooted in the Vedic traditions o`
  * cat[4].clue[3] (value 400) — 516 chars · sample: `Cultural diffusion is the spread of ideas, religions, technologies, and customs `
  * cat[4].clue[4] (value 500) — 528 chars · sample: `The Black Death (1347–1351 CE) was a bubonic plague pandemic caused by the bacte`

### `games/precalculus/03 - Exponential and Logarithmic Functions Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[0].clue[4] (value 500) — 523 chars · sample: `End behavior of log: log_b(x) for b>1 increases without bound as x->inf, but ver`
  * cat[2].clue[1] (value 200) — 533 chars · sample: `Continuous exponential growth: A(t) = A_0 * e^(kt) where A_0 is initial amount a`
  * cat[3].clue[4] (value 500) — 518 chars · sample: `Reflection across y=x: The graph of y=ln(x) is the reflection of y=e^x across th`
  * cat[4].clue[0] (value 100) — 511 chars · sample: `Asymptote of e^x: f(x)=e^x has horizontal asymptote y=0 as x->-inf (e^x -> 0+, a`
* **final-explanation-too-verbose** (1)
  * final — 516 chars

### `games/precalculus/04 - Trigonometric Functions Jeopardy Review.html` — 5 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[0].clue[0] (value 100) — 523 chars · sample: `Unit circle: A circle of radius 1 centered at the origin (0,0). Equation: x^2 + `
  * cat[1].clue[0] (value 100) — 515 chars · sample: `Period of sin: sin(x+2pi) = sin(x) for all x; the smallest positive period is 2p`
  * cat[1].clue[1] (value 200) — 508 chars · sample: `General sinusoid: y = A sin(B(x-C)) + D. A: amplitude (|A|). B: angular frequenc`
  * cat[2].clue[2] (value 300) — 516 chars · sample: `Signs by quadrant (ASTC mnemonic 'All Students Take Calculus'): Q1 all positive;`
* **final-explanation-too-verbose** (1)
  * final — 526 chars

### `games/grade-7-math-practice/practice-exam.html` — 5 flag(s), 30 items audited

* **prompt-too-terse** (2)
  * q[16] id=g7math-017 — 24 chars (<30) · sample: `Solve for x: 3x + 5 = 11`
  * q[17] id=g7math-018 — 27 chars (<30) · sample: `Solve for x: (1/4)x - 7 = 3`
* **prompt-missing-end-punct** (3)
  * q[16] id=g7math-017 · sample: `Solve for x: 3x + 5 = 11`
  * q[17] id=g7math-018 · sample: `Solve for x: (1/4)x - 7 = 3`
  * q[18] id=g7math-019 · sample: `Solve the inequality: -2x > 10`

### `games/ap-microeconomics/04 - Unit 4 Imperfect Competition Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[0].clue[4] (value 500) — 504 chars · sample: `A Nash equilibrium is a set of strategies where no player can improve their payo`
  * cat[1].clue[2] (value 300) — 527 chars · sample: `Price discrimination means charging different consumers different prices for the`
  * cat[3].clue[0] (value 100) — 521 chars · sample: `Game theory models strategic interactions where each player's outcome depends on`
* **final-explanation-too-verbose** (1)
  * final — 512 chars

### `games/ap-us-government/01 - Unit 1 Foundations of American Democracy Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[3].clue[3] (value 400) — 502 chars · sample: `Article V provides two paths for proposing amendments (2/3 vote of both houses o`
  * cat[4].clue[1] (value 200) — 528 chars · sample: `Written by James Madison in 1787, Federalist No. 10 is a required AP Gov foundat`
  * cat[4].clue[4] (value 500) — 512 chars · sample: `Judicial review is the power of federal courts — ultimately the Supreme Court — `
* **final-explanation-too-verbose** (1)
  * final — 609 chars

### `games/economics/02 - Markets and Prices Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[3].clue[1] (value 200) — 505 chars · sample: `A monopoly is a market structure with a single seller facing no close competitio`
  * cat[3].clue[3] (value 400) — 527 chars · sample: `An excise tax is a per-unit tax on a specific good (gasoline, cigarettes, alcoho`
  * cat[4].clue[2] (value 300) — 518 chars · sample: `Consumer choice theory models how rational buyers maximize utility subject to th`
* **final-explanation-too-verbose** (1)
  * final — 535 chars

### `games/economics/99 - Cumulative Yearlong Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[0].clue[3] (value 400) — 508 chars · sample: `Cost-benefit analysis quantifies all expected gains and losses of a decision to `
  * cat[1].clue[0] (value 100) — 506 chars · sample: `Supply is the positive relationship between price and quantity producers are wil`
  * cat[3].clue[3] (value 400) — 524 chars · sample: `The business cycle is the recurring pattern of economic expansion (rising GDP, f`
* **final-explanation-too-verbose** (1)
  * final — 544 chars

### `games/geometry/05 - Circles Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[0].clue[0] (value 100) — 529 chars · sample: `A radius is a segment from the center of a circle to any point on the circle; al`
  * cat[0].clue[4] (value 500) — 547 chars · sample: `A tangent to a circle is a line touching the circle at exactly one point (point `
  * cat[1].clue[1] (value 200) — 502 chars · sample: `An inscribed angle has its vertex on the circle and sides as chords; its measure`
  * cat[2].clue[4] (value 500) — 503 chars · sample: `The Power of a Point theorem unifies chord, secant, and tangent relationships fo`

### `games/geometry/07 - Measurement and Dimension Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[0].clue[0] (value 100) — 535 chars · sample: `The area of a triangle is A=(1/2)·b·h, where b is any base and h is the perpendi`
  * cat[0].clue[1] (value 200) — 505 chars · sample: `The area of a parallelogram is A=b·h, where b is the base and h is the perpendic`
  * cat[4].clue[1] (value 200) — 520 chars · sample: `A cross section by a plane parallel to the base produces a figure congruent (or `
  * cat[4].clue[3] (value 400) — 548 chars · sample: `A solid of revolution is a 3D solid generated by rotating a 2D figure about an a`

### `games/grade-6/06 - Mediterranean World Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[2].clue[0] (value 100) — 544 chars · sample: `The Byzantine Empire was the Greek-speaking eastern continuation of the Roman Em`
  * cat[2].clue[3] (value 400) — 515 chars · sample: `Eastern Orthodox Christianity developed as the dominant Christian tradition of t`
  * cat[4].clue[0] (value 100) — 503 chars · sample: `The Crusades were a series of military expeditions (1096–1291 CE) launched by Eu`
* **final-explanation-too-verbose** (1)
  * final — 560 chars

### `games/grade-9-ela/06 - Writing - Narrative and Explanatory Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (4)
  * cat[1].clue[4] (value 500) — 522 chars · sample: `The 'so what' conclusion explains why the topic matters in a broader context bey`
  * cat[2].clue[3] (value 400) — 504 chars · sample: `Nonlinear narrative arranges events out of chronological order to create themati`
  * cat[3].clue[1] (value 200) — 508 chars · sample: `Expository (explanatory) writing informs without persuading: how-to guides, defi`
  * cat[3].clue[2] (value 300) — 504 chars · sample: `Block organization for compare-contrast presents all features of Subject A, then`

### `games/precalculus/06 - Vectors and Parametric Equations Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[0].clue[1] (value 200) — 503 chars · sample: `Vector addition: Add components: <2,-1> + <3,5> = <2+3, -1+5> = <5, 4>. Geometri`
  * cat[3].clue[0] (value 100) — 525 chars · sample: `Vector: A quantity with both magnitude (size) and direction. Contrast with scala`
  * cat[3].clue[4] (value 500) — 505 chars · sample: `Vector projection: proj_u(v) = ((u.v)/|u|^2) u. Here u=<2,0>, v=<4,1>: u.v = 4*2`
* **final-explanation-too-verbose** (1)
  * final — 553 chars

### `games/precalculus/99 - Cumulative Yearlong Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[0].clue[1] (value 200) — 534 chars · sample: `Degree 4 polynomial has exactly 4 complex roots (Fundamental Theorem of Algebra)`
  * cat[1].clue[3] (value 400) — 509 chars · sample: `Quadratic formula: x = (-b +/- sqrt(b^2-4ac))/(2a) = (4 +/- sqrt(16-52))/2 = (4 `
  * cat[4].clue[0] (value 100) — 516 chars · sample: `Domain of ln: x > 0 (strictly positive). At x=0 the natural log is undefined; fo`
* **final-explanation-too-verbose** (1)
  * final — 532 chars

### `games/us-history-units/01 - Colonial Foundations Jeopardy Review.html` — 4 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[3].clue[0] (value 100) — 501 chars · sample: `The Navigation Acts (1651–1673) required colonial goods to be shipped on English`
  * cat[4].clue[0] (value 100) — 514 chars · sample: `Bacon's Rebellion (1676) was an armed uprising in Virginia led by Nathaniel Baco`
  * cat[4].clue[3] (value 400) — 501 chars · sample: `On March 5, 1770, British soldiers fired into a crowd of colonists in Boston, ki`
* **final-explanation-too-verbose** (1)
  * final — 558 chars

### `games/ap-world-practice/practice-exam.html` — 4 flag(s), 45 items audited

* **explanation-missing-end-punct** (2)
  * q[11] id=apwh-012 · sample: `s honored him as Kanuni, 'the Lawgiver.'`
  * q[15] id=apwh-016 · sample: `l in Calicut as 'Christians and spices.'`
* **prompt-missing-end-punct** (1)
  * q[36] id=apwh-037 · sample: ` conflict. The crisis was resolved when:`
* **choices-length-variance** (1)
  * q[39] id=apwh-040 — min=51, max=210, ratio=4.1

### `games/regents-algebra-1/practice-exam.html` — 4 flag(s), 40 items audited

* **prompt-too-terse** (4)
  * q[16] id=alg1-017 — 28 chars (<30) · sample: `Which sequence is geometric?`
  * q[19] id=alg1-020 — 17 chars (<30) · sample: `Factor: x^2 - 49.`
  * q[20] id=alg1-021 — 22 chars (<30) · sample: `Factor: x^2 + 5x - 14.`
  * q[21] id=alg1-022 — 22 chars (<30) · sample: `Factor: 2x^2 + 7x + 3.`

### `games/algebra-1/99 - Cumulative Yearlong Jeopardy Review.html` — 3 flag(s), 26 items audited

* **explanation-missing-end-punct** (2)
  * cat[1].clue[4] (value 500) · sample: `mber because the variable counts items.'`
  * cat[3].clue[0] (value 100) · sample: `'How many adults and children attended?'`
* **final-explanation-too-verbose** (1)
  * final — 757 chars

### `games/ap-psychology/02 - Biological Bases Jeopardy Review.html` — 3 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[3].clue[4] (value 500) — 505 chars · sample: `The autonomic nervous system (ANS) controls involuntary functions — heart rate, `
  * cat[4].clue[4] (value 500) — 503 chars · sample: `REM (rapid eye movement) sleep is the stage associated with vivid dreaming, mark`
* **final-explanation-too-verbose** (1)
  * final — 504 chars

### `games/earth-science/02 - Earth in Space Jeopardy Review.html` — 3 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[3].clue[3] (value 400) — 518 chars · sample: `The Doppler effect is the change in observed wave frequency due to relative moti`
  * cat[4].clue[4] (value 500) — 504 chars · sample: `A supernova is the catastrophic explosion of a massive star (≥8 solar masses) th`
* **final-explanation-too-verbose** (1)
  * final — 722 chars

### `games/grade-5-ela/02 - Reading Literature - Theme and Author's Craft Jeopardy Review.html` — 3 flag(s), 26 items audited

* **explanation-too-verbose** (3)
  * cat[0].clue[4] (value 500) — 516 chars · sample: `Contrast is when authors place two characters, settings, or events side-by-side `
  * cat[2].clue[3] (value 400) — 512 chars · sample: `Personification gives human qualities, actions, or feelings to non-human things.`
  * cat[2].clue[4] (value 500) — 506 chars · sample: `Hyperbole is exaggeration used for effect, not meant to be taken literally. Exam`

### `games/grade-5-math/04 - Measurement and Volume Jeopardy Review.html` — 3 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[0].clue[0] (value 100) — 503 chars · sample: `Worked example: rectangular prism volume V = length x width x height (5.MD.C.5).`
  * cat[0].clue[3] (value 400) — 533 chars · sample: `Worked example: composite figure made of two prisms with volumes 24 cm³ and 18 c`
* **final-explanation-too-verbose** (1)
  * final — 550 chars

### `games/grade-5/02 - Complex Societies and Civilizations Jeopardy Review.html` — 3 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[2].clue[1] (value 200) — 515 chars · sample: `Tenochtitlan was the spectacular island capital of the Aztec Empire, built in th`
  * cat[3].clue[0] (value 100) — 554 chars · sample: `The Inca built the largest empire in the Western Hemisphere — called Tawantinsuy`
* **final-explanation-too-verbose** (1)
  * final — 548 chars

### `games/grade-7-ela-practice/practice-exam.html` — 3 flag(s), 30 items audited

* **prompt-missing-end-punct** (3)
  * q[15] id=g7ela-016 · sample: `-ed 'Should Middle Schools Start Later?'`
  * q[20] id=g7ela-021 · sample: `at on the steps because her feet ached.'`
  * q[25] id=g7ela-026 · sample: `ues, the word ARDUOUS most likely means:`

### `games/algebra-1/01 - Linear Equations and Inequalities Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-missing-end-punct** (1)
  * cat[4].clue[2] (value 300) · sample: `sold tickets, which cannot be negative.'`
* **final-explanation-too-verbose** (1)
  * final — 594 chars

### `games/algebra-1/08 - Statistics and Residuals Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-missing-end-punct** (1)
  * cat[4].clue[2] (value 300) · sample: `nt?' or 'Is this survey representative?'`
* **final-explanation-too-verbose** (1)
  * final — 589 chars

### `games/ap-art-history/09 - Pacific Jeopardy Review.html` — 2 flag(s), 26 items audited

* **clue-too-terse** (2)
  * cat[1].clue[3] (value 400) — 10 chars · sample: `Bisj pole.`
  * cat[1].clue[4] (value 500) — 11 chars · sample: `Tapa cloth.`

### `games/ap-economics-combined/03 - Firms and Market Structures Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[2].clue[1] (value 200) — 513 chars · sample: `Price discrimination occurs when a seller charges different prices to different `
* **final-explanation-too-verbose** (1)
  * final — 502 chars

### `games/ap-microeconomics/05 - Unit 5 Factor Markets Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[4].clue[1] (value 200) — 517 chars · sample: `Human capital is the stock of productive knowledge, skills, health, and experien`
  * cat[4].clue[3] (value 400) — 520 chars · sample: `A monopsony is a market with a single buyer of a factor (often labor). To attrac`

### `games/ap-world-history/99 - Cumulative Yearlong Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[3].clue[1] (value 200) — 502 chars · sample: `The MAIN framework identifies structural causes of WWI: Militarism (arms race, g`
  * cat[4].clue[1] (value 200) — 507 chars · sample: `The Cold War (c. 1947–1991) organized global politics into two blocs—U.S.-led ca`

### `games/civics-pig/01 - Foundations of Government Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[0].clue[0] (value 100) — 514 chars · sample: `Due process, guaranteed by the 5th and 14th Amendments, requires the government `
* **final-explanation-too-verbose** (1)
  * final — 506 chars

### `games/earth-science/01 - Measurement and Models Jeopardy Review.html` — 2 flag(s), 26 items audited

* **final-clue-too-verbose** (1)
  * final — 329 chars
* **final-explanation-too-verbose** (1)
  * final — 593 chars

### `games/global-9/07 - Ottoman and Ming Worlds Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[2].clue[3] (value 400) — 505 chars · sample: `Zheng He (1371-1433) was a Muslim Chinese admiral who led seven massive naval ex`
  * cat[3].clue[1] (value 200) — 539 chars · sample: `Between 1405 and 1433, the Ming Yongle emperor dispatched Muslim eunuch admiral `

### `games/global-9/99 - Cumulative Yearlong Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[4].clue[2] (value 300) — 507 chars · sample: `The Scientific Revolution (c.1543-1687) overturned centuries of Church-sanctione`
* **final-explanation-too-verbose** (1)
  * final — 572 chars

### `games/grade-5-ela/03 - Reading Informational Texts Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[0].clue[0] (value 100) — 502 chars · sample: `Main idea is the most important point an informational text makes about its topi`
  * cat[1].clue[1] (value 200) — 503 chars · sample: `Illustrations include photographs, drawings, diagrams, and other images that go `

### `games/grade-6/04 - Comparative World Religions Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[4].clue[0] (value 100) — 501 chars · sample: `Confucianism is a philosophical and ethical system based on the teachings of Con`
* **final-explanation-too-verbose** (1)
  * final — 508 chars

### `games/grade-8/05 - Great Depression Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[2].clue[0] (value 100) — 509 chars · sample: `The Great Depression was the worst economic disaster in American history. By 193`
  * cat[2].clue[4] (value 500) — 503 chars · sample: `The Dust Bowl resulted from drought beginning in 1930 combined with decades of d`

### `games/grade-8/06 - World War II Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[2].clue[3] (value 400) — 509 chars · sample: `The Holocaust was the Nazi state's deliberate attempt to murder all Jewish peopl`
  * cat[4].clue[3] (value 400) — 509 chars · sample: `Executive Order 9066 (February 1942) authorized the military to remove Japanese `

### `games/grade-9-ela/02 - Reading Literature - Theme Craft Point of View Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[0].clue[4] (value 500) — 505 chars · sample: `Mary Shelley subtitled Frankenstein 'The Modern Prometheus.' Victor's pursuit of`
* **final-explanation-too-verbose** (1)
  * final — 506 chars

### `games/grade-9-ela/03 - Reading Informational - Main Idea Argument Evidence Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[3].clue[2] (value 300) — 516 chars · sample: `The CRAAP test (Currency, Relevance, Authority, Accuracy, Purpose) is a standard`
  * cat[3].clue[3] (value 400) — 510 chars · sample: `False dilemma (false dichotomy) presents only two options when more exist. RI.9-`

### `games/precalculus/01 - Functions Review Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[3].clue[2] (value 300) — 518 chars · sample: `Horizontal Line Test: If every horizontal line crosses the graph of f at most on`
* **final-explanation-too-verbose** (1)
  * final — 543 chars

### `games/precalculus/05 - Trig Identities and Equations Jeopardy Review.html` — 2 flag(s), 26 items audited

* **explanation-too-verbose** (2)
  * cat[0].clue[2] (value 300) — 509 chars · sample: `Simplify: (1 - cos^2 x)/sin x = sin^2 x / sin x = sin x. First step uses Pythago`
  * cat[2].clue[3] (value 400) — 502 chars · sample: `Tan(2x) = 2 tan x / (1 - tan^2 x): Derives from sum formula tan(x+x) with A=B=x.`

### `games/ap-csp-practice/practice-exam.html` — 2 flag(s), 40 items audited

* **choices-length-variance** (2)
  * q[20] id=apcsp-021 — min=1, max=55, ratio=55.0
  * q[28] id=apcsp-029 — min=36, max=153, ratio=4.3

### `games/ap-precalc-practice/practice-exam.html` — 2 flag(s), 40 items audited

* **prompt-too-terse** (2)
  * q[12] id=appc-013 — 28 chars (<30) · sample: `Solve for x: 3^(x + 1) = 81.`
  * q[22] id=appc-023 — 29 chars (<30) · sample: `Evaluate sec(pi / 4) exactly.`

### `games/grade-8-math-practice/practice-exam.html` — 2 flag(s), 30 items audited

* **prompt-too-terse** (1)
  * q[6] id=g8math-007 — 29 chars (<30) · sample: `Simplify: 5^9 divided by 5^4.`
* **choices-length-variance** (1)
  * q[18] id=g8math-019 — min=14, max=70, ratio=5.0

### `games/regents-geometry/practice-exam.html` — 2 flag(s), 40 items audited

* **prompt-missing-end-punct** (2)
  * q[8] id=geom-009 · sample: `pendicular. The quadrilateral must be a:`
  * q[33] id=geom-034 · sample: `s that two solids have equal volumes if:`

### `games/algebra-1/02 - Linear Functions and Graphs Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 587 chars

### `games/algebra-1/03 - Systems of Equations Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 633 chars

### `games/algebra-1/04 - Exponents and Radicals Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 562 chars

### `games/algebra-1/05 - Polynomials and Factoring Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 541 chars

### `games/algebra-1/06 - Quadratic Functions Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 605 chars

### `games/algebra-1/07 - Exponential Functions Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 573 chars

### `games/ap-european-history/01 - Unit 1 Renaissance and Exploration Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[0].clue[0] (value 100) — 506 chars · sample: `Renaissance humanism (~1350-1600) revived Greek and Roman texts to argue that hu`

### `games/ap-human-geography/02 - Unit 2 Population and Migration Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[0].clue[0] (value 100) — 547 chars · sample: `Population is the simplest count of how many people occupy a place — a country, `

### `games/ap-human-geography/05 - Unit 5 Agriculture and Rural Land-Use Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[3].clue[2] (value 300) — 502 chars · sample: `Intensive wet rice (paddy) farming is the labor-intensive cultivation of rice in`

### `games/ap-human-geography/06 - Unit 6 Cities and Urban Land-Use Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 502 chars

### `games/ap-world-history/05 - Unit 5 Revolutions Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[4].clue[1] (value 200) — 510 chars · sample: `The Meiji Restoration (1868) ended Tokugawa shogunate rule and restored imperial`

### `games/ap-world-history/06 - Unit 6 Consequences of Industrialization Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[3].clue[2] (value 300) — 514 chars · sample: `The Self-Strengthening Movement (1861–1895) was the Qing government's attempt to`

### `games/ap-world-history/07 - Unit 7 Global Conflict Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 502 chars

### `games/earth-science/03 - Energy in Earth System Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 542 chars

### `games/earth-science/04 - Insolation and Seasons Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 637 chars

### `games/earth-science/05 - Weather Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 755 chars

### `games/earth-science/06 - Climate Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 533 chars

### `games/earth-science/07 - Water Cycle and Hydrology Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 519 chars

### `games/earth-science/99 - Cumulative Yearlong Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 504 chars

### `games/global-10-units/99 - Cumulative Yearlong Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 557 chars

### `games/global-9/09 - Western Europe and Russia Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[4].clue[3] (value 400) — 529 chars · sample: `The Scientific Revolution (c.1543-1687) was a fundamental transformation in Euro`

### `games/grade-11-ela/99 - Cumulative Yearlong Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 559 chars

### `games/grade-5-ela/05 - Writing Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[1].clue[4] (value 500) — 502 chars · sample: `Supporting details are facts, examples, statistics, expert quotes, and reasons t`

### `games/grade-5-ela/06 - Language and Vocabulary Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[2].clue[3] (value 400) — 503 chars · sample: `A word family is a group of related words that share a common root - act, action`

### `games/grade-6-ela/02 - Reading Literature: Theme + Craft Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-clue-too-verbose** (1)
  * final — 338 chars

### `games/grade-6-ela/03 - Reading Informational: Main Idea, Text Structure Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-clue-too-verbose** (1)
  * final — 366 chars

### `games/grade-6-ela/99 - Cumulative Yearlong Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-clue-too-verbose** (1)
  * final — 403 chars

### `games/grade-6/02 - First Humans Through the Neolithic Revolution Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 537 chars

### `games/grade-6/03 - Early River Valley Civilizations Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 523 chars

### `games/grade-6/05 - Comparative Classical Civilizations Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 589 chars

### `games/grade-8/02 - A Changing Society Jeopardy Review.html` — 1 flag(s), 26 items audited

* **final-explanation-too-verbose** (1)
  * final — 505 chars

### `games/grade-8/04 - World War I and the Roaring Twenties Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[4].clue[1] (value 200) — 502 chars · sample: `The Harlem Renaissance (roughly 1920–1935) was an explosion of African American `

### `games/grade-9-ela/04 - Reading Informational - Rhetoric Tone Purpose Jeopardy Review.html` — 1 flag(s), 26 items audited

* **explanation-too-verbose** (1)
  * cat[4].clue[2] (value 300) — 509 chars · sample: `Subjective stance foregrounds the writer's personal perspective, often through f`

### `games/grade-8-science-practice/practice-exam.html` — 1 flag(s), 35 items audited

* **explanation-missing-end-punct** (1)
  * q[24] id=g8sci-025 · sample: `the Andes or the Pacific 'Ring of Fire.'`

### `games/regents-algebra-2/practice-exam.html` — 1 flag(s), 40 items audited

* **prompt-too-terse** (1)
  * q[14] id=alg2-015 — 27 chars (<30) · sample: `Solve 3^(x + 1) = 27 for x.`

---

_End of report._