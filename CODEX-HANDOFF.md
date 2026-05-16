# Codex Handoff — Mr. Mac's Review Arcade

**Master prompt to pick up where the May 16 2026 Claude session ended and continue platform expansion + polish.**

Paste the prompt below into a fresh Codex session at the repo root.

---

You are picking up Mr. Mac's Review Arcade where a previous session (Claude, May 16 2026) left off. The arcade is Jon's free social-studies review platform that has expanded into a comprehensive 5-12 + AP review system. Your job: extend it to full quality + completeness across every subject and every AP, and continue platform polish.

## REPO + STATE

- Local path: `/Volumes/CURRICULA/00_ACTIVE_CURRENT_PROJECTS/Review_Arcade/mr-macs-review-arcade-live`
- Remote: https://github.com/SirhanMacx/mr-macs-review-arcade
- Current HEAD: `df9940d` "+16 high-quality Jeopardy courses on top of Codex's all-subject base" on top of `96759da` (your own earlier "Point generated runners at arcade favicon" which closed out the all-subject content system you shipped 2026-05-15/16).
- Branch: `main`, deploys via GitHub Pages.
- Working tree should be clean. If not, run `git status` first.

Before doing anything else, sync:

```bash
cd /Volumes/CURRICULA/00_ACTIVE_CURRENT_PROJECTS/Review_Arcade/mr-macs-review-arcade-live
find . -name "._*" -type f -not -path "./.git/*" -delete   # macOS metadata pollution chokes validators
git status && git pull origin main
```

## WHO YOU'RE BUILDING FOR

Jon (Mr. Mac) is a HS social studies teacher at Great Neck (NY) who built this arcade for his own students and is now extending it as a platform for every subject + grade level. He prefers:

- "Execute with prejudice. Make no mistakes." Action over discussion.
- Date-based versions (`v23.2026-05-16` style), atomic commits, clean history.
- Match the social-studies arcade quality, not the generic-Jeopardy template Codex generated earlier. The hand-built per-course boards in `/games/global-10-units/` are the gold-standard reference.
- No emojis in commits or code unless he explicitly asks.

## THE QUALITY BAR (READ THIS FIRST)

Open this file and read the `const GAME = {...}` block at line ~1178:

```
games/global-10-units/01 - World in 1750 Jeopardy Review.html
```

That is the gold-standard structure every new Jeopardy board must match:

- 5 board-specific categories (NOT generic like "AP Concept", "People + Places", "Big Picture", "Historical Thinking", "Final"). The validator actively blocks those.
- 5 clues per category at values 100/200/300/400/500.
- Each clue: `clue` (Jeopardy "answer" style, ≤24 words), `answer` (Jeopardy "question" form, short), `aliases` (4-6 variants — singular, plural, full form, abbreviation), `explanation` (500-700 chars with 1+ named person/date/place/case/study + "[Course] Unit X tests..." pedagogy tie), and `rigor` metadata (already auto-derived by the builder).
- One Daily Double (`daily: true`) per board, ideally row 3 value 400+.
- One Final Jeopardy with a board-specific synthesis category (NOT "Historical Thinking" etc.), single answer, aliases, rich explanation.

Sample clue at the right quality bar:

```json
{
  "value": 400,
  "clue": "Linear relationship between ln(k) and 1/T whose slope yields activation energy.",
  "answer": "Arrhenius equation",
  "aliases": ["Arrhenius equation","Arrhenius plot","k = A*exp(-Ea/RT)","Arrhenius rate law"],
  "explanation": "The Arrhenius equation k = A*e^(-Ea/RT) was proposed by Svante Arrhenius in 1889. Taking the natural log linearizes it to ln(k) = ln(A) - Ea/(RT), so a plot of ln(k) vs 1/T gives slope = -Ea/R and y-intercept = ln(A). A is the pre-exponential frequency factor; Ea is activation energy (typical organic reactions 50-100 kJ/mol). Catalysts lower Ea, not A. AP Chemistry Unit 5 routinely asks students to extract Ea from two-temperature data using ln(k2/k1) = -Ea/R * (1/T2 - 1/T1) - a free-response staple every year since 2014."
}
```

## PIPELINE YOU INHERIT

All scripts live in `scripts/`:

- `build-course.mjs <spec.json>` — reads a course-spec JSON, produces `games/<slug>/index.html` (landing page cloned from global-10-units) + `games/<slug>/01..99-*.html` (Jeopardy boards with GAME JSON replaced) + `data/manifest-shards/<slug>.json`. Parallel-safe. See the script's header comment for the spec schema.
- `merge-manifest-shards.mjs` — consolidates every shard into `games.json`. Idempotent (replaces by id, appends new).
- `validate-jeopardy-boards.mjs` — full validator. Currently fails with ~80-200 issues (mostly non-blocking content nits).
- `rebuild-jeopardy-groundup.mjs` — auto-rebalances clues into the correct categories per `CATEGORY_BLUEPRINTS`, strips lingering `"{Category}: "` prefixes from clue text, repositions Daily Double.
- `harden-jeopardy-boards.mjs` — reinforces explanation depth, alias coverage, fallback-clue replacement.
- `harden-ap-jeopardy-rigor.mjs` — applies AP-rigor-v2 to AP boards in `AP_DIRS` list (extend this list when you add new AP courses).
- `fix-scrambled-boards.mjs` — dedupes within-category by answer, renumbers to canonical 100..500.
- `fix-generic-finals.mjs` — replaces blocked finals (`AP Concept` / `Historical Thinking` / `Big Picture` / etc.) with title-derived synthesis labels per course.

Canonical workflow for building a course:

```bash
# 1. Write spec JSON to /tmp/build-<slug>.json
# 2. Build
node scripts/build-course.mjs /tmp/build-<slug>.json
# 3. Repeat for each course
# 4. Merge shards
node scripts/merge-manifest-shards.mjs
# 5. Polish
node scripts/rebuild-jeopardy-groundup.mjs
node scripts/fix-scrambled-boards.mjs
node scripts/fix-generic-finals.mjs
# 6. Validate (target: <50 issues)
node scripts/validate-jeopardy-boards.mjs | head -1
# 7. Bump service-worker.js CACHE_NAME (v24+, current is v23)
# 8. Add CHANGELOG.md entry
# 9. Commit + push
```

## WHAT'S MISSING (FOLLOW-UP COURSES — Wave 4)

These have `COURSE_PALETTE` entries already staged in `index.html` and the build pipeline ready. Build each as its own course spec + boards.

### NY Regents math + science — ✅ SHIPPED Wave 4a (commit `0207d7b`, May 16 2026)

All 7 NY Regents courses landed in [Wave 4a commit `0207d7b`](https://github.com/SirhanMacx/mr-macs-review-arcade/commit/0207d7b):

- ✅ **`living-environment`** (9 boards) — Cells, Genetics, Evolution, Ecology, Human Body Systems
- ✅ **`earth-science`** (11 boards) — Astronomy, Weather, Climate, Geology, Geologic History
- ✅ **`chemistry-regents`** (11 boards) — Atomic Concepts → Nuclear Chemistry
- ✅ **`physics-regents`** (11 boards) — Mechanics → Modern Physics
- ✅ **`algebra-1`** (9 boards) — NY Common Core
- ✅ **`geometry`** (9 boards) — NY Common Core
- ✅ **`algebra-2`** (9 boards) — NY Common Core

Do NOT rebuild these — they're already in `games.json` and the hub. Run the rebuild/harden scripts across them as part of platform polish, but don't overwrite.

### Missing APs

1. **`ap-calculus-ab`** — 8 units + Cumulative (Limits → Apps of Integration)
2. **`ap-calculus-bc`** — 10 units + Cumulative (AB + parametric/polar/vectors + series)
3. **`ap-statistics`** — 9 units + Cumulative
4. **`ap-english-language`** — 9 units + Cumulative
5. **`ap-english-literature`** — 9 units + Cumulative
6. **`ap-environmental-science`** — 9 units + Cumulative
7. **`ap-physics-1`** — 8 units + Cumulative
8. **`ap-physics-2`** — 7 units + Cumulative
9. **`ap-physics-c-mechanics`** — 7 units + Cumulative (calculus-based)
10. **`ap-physics-c-em`** — 7 units + Cumulative (calculus-based)
11. **`ap-computer-science-a`** — 10 units + Cumulative (Java focus)
12. **`ap-comparative-government`** — 5 units + Cumulative
13. **`ap-art-history`** — 10 content-area boards + Cumulative
14. **`ap-latin`** — 9 units + Cumulative (Vergil Aeneid + Caesar Gallic Wars)
15. **`ap-german-language`** — 6 themes + Cumulative

### Missing MS / HS subjects

16. **`grade-6-ela`**, **`grade-7-ela`**, **`grade-8-ela`** (NY ELA, 7 units each + Cumulative)
17. **`grade-7-math`**, **`grade-8-math`** (NY Common Core, 6 units each + Cumulative)
18. **`grade-6-science`**, **`grade-7-science`**, **`grade-8-science`** (NGSS-based)

### Workflow shortcut: `scripts/expand-compact-spec.py`

For each course you build, you can write a compact Python spec (much easier than hand-writing JSON) and expand it:

```bash
# 1. Write /tmp/spec_<slug>.py with a SPEC = {...} dict
# 2. python3 scripts/expand-compact-spec.py /tmp/spec_<slug>.py
#    → writes /tmp/build-<slug>.json
# 3. node scripts/build-course.mjs /tmp/build-<slug>.json
```

The Python expander uses helpers `C()` (category), `Q()` (clue), `F()` (final) and avoids JSON escaping issues for multi-line explanations. See `/tmp/spec_ap_calculus_ab.py` (if still around) for an example template.

Reference: `index.html` lines ~9332-9410 (`COURSE_PALETTE`) lists every expected `courseLabel` + accent/glyph. Use exact `courseLabel` strings when writing spec JSONs so the hub auto-surfaces them in the rail.

## CRITICAL PITFALLS (avoid these — they ate 2 hours of last session)

1. **DO NOT dispatch 20+ sub-agents in parallel.** Anthropic rate limits collapsed ~80% of agents mid-task. Instead:
   - Build inline yourself (you're already an agent), OR
   - Dispatch a single Opus-tier orchestrator that serializes its own sub-tasks, OR
   - Wave-batch (3-4 agents per wave, wait for completion before next)

2. **macOS AppleDouble pollution:** `/Volumes/CURRICULA` generates `._*` metadata files constantly. They break validators, scripts, and the build pipeline. Run this at session start AND before every commit:

   ```bash
   find . -name "._*" -type f -not -path "./.git/*" -delete
   ```

3. **`.git/index.lock` sometimes gets stuck** after interrupted commands:

   ```bash
   rm -f .git/index.lock
   ```

4. **Build scripts have been accidentally deleted out-of-band before.** If they're missing, restore from git:

   ```bash
   git checkout HEAD -- scripts/build-course.mjs scripts/merge-manifest-shards.mjs
   ```

5. **The shared question bank `assets/shared-question-bank.js` is 131k+ lines** and you authored it. Do not regenerate it from scratch — only patch deltas. New Jeopardy course content lives in `games/<slug>/`, NOT in the shared bank.

## DO-NOT-TOUCH LIST

- **Existing social-studies course directories** (the gold-standard reference): `global-10-units`, `global-9`, `us-history-units`, `apush`, `ap-psychology`, `ap-world-history`, `ap-european-history`, `ap-human-geography`, `ap-us-government`, `ap-macroeconomics`, `ap-microeconomics`, `ap-economics-combined`, `civics-pig`, `economics`, `grade-5`, `grade-6`, `grade-7`, `grade-8` — these are Jon's hand-built originals. Polish only via the existing harden/rebuild/fix scripts; never overwrite by hand.

- **The 16 courses already built in HEAD `df9940d`**: `ap-biology`, `ap-chemistry`, `ap-computer-science-principles`, `ap-french-language`, `ap-music-theory`, `ap-spanish-language`, `ap-spanish-literature`, `precalculus`, `grade-5-ela`, `grade-5-math`, `grade-5-science`, `grade-6-math`, `grade-9-ela`, `grade-10-ela`, `grade-11-ela`, `grade-12-ela` — leave their directories untouched. The rebuild/harden scripts can run across them as a group, that's fine.

- **The 7 NY Regents courses built in HEAD `0207d7b` (Wave 4a)**: `living-environment`, `earth-science`, `chemistry-regents`, `physics-regents`, `algebra-1`, `geometry`, `algebra-2` — same treatment. Polish via rebuild/harden, do not rewrite.

- DO NOT modify Jon's emails, hostnames, or personal info anywhere.

## PLATFORM ENHANCEMENTS (after courses are built)

Once Wave 4 courses ship, then go after platform polish:

1. **Validator-to-zero pass**: ~80-200 validator issues remain across the catalog. Most are non-blocking nits (clue placement, too-close alias to board answer, repeated answers across categories, "too wordy" AP clues >24 words). Resolve them surgically:

   ```bash
   node scripts/validate-jeopardy-boards.mjs 2>&1 | head -200
   ```

   Group failures by error class, write a fixer `.mjs` per class, run.

2. **Cumulative Yearlong gap**: a few existing courses (`global-10-units` especially) have a `99` file but their landing page doesn't link to it. Add the Final card to every course's `index.html` consistently.

3. **`AP_DIRS` extension**: `scripts/harden-ap-jeopardy-rigor.mjs` has an `AP_DIRS` list (line ~10) that only covers the original 8 APs. Add every new `ap-*` dir (`ap-biology`, `ap-chemistry`, `ap-cs-principles`, `ap-spanish-language`, etc.) so they get the AP-rigor-v2 treatment.

4. **`CATEGORY_BLUEPRINTS` extension**: `scripts/rebuild-jeopardy-groundup.mjs` has a `CATEGORY_BLUEPRINTS` map (line ~17) with per-unit category names for ~6 courses. Extend it for every new course so the rebuild script can polish them (otherwise it falls back to "polish-only" for the new courses).

5. **Hub `COURSE_PALETTE` audit**: `index.html` ~9332. Every entry in `games.json`'s `course` field should have a matching palette entry, else the rail shows the default purple. Add any missing.

6. **Renderer label types**: `index.html` `renderCourseTiles()` uses a labelType heuristic. Audit so AP / NYS Regents / Grade / Elective are all classified correctly.

7. **Featured 10 rotation**: currently hardcoded 10 flagship games on the hub. With 30+ new courses ready, consider rotating featured by week or by user profile.

8. **Smoke tests**: `tests/playable-smoke.spec.mjs` only covers ~10 flagship games. Extend coverage to spot-check 1 board per new course so we catch generation regressions early.

9. **Mobile polish on new boards**: spot-check on iPhone 14 viewport (390px) that the generated Jeopardy boards from `build-course.mjs` render correctly — they clone the `global-10-units` template which is already mobile-tuned, but verify.

10. **Service Worker precache**: Currently caches ~55 asset modules. When you add courses, the SW cache list in `service-worker.js` doesn't need per-board entries (network-first for HTML/JSON handles it), but bump `CACHE_NAME` each ship.

## VERIFICATION CHECKLIST BEFORE EACH COMMIT

- [ ] `find . -name "._*" -type f -delete`  (clean Apple junk)
- [ ] `node scripts/merge-manifest-shards.mjs`
- [ ] `node scripts/validate-jeopardy-boards.mjs | head -1`  (count regressing? STOP)
- [ ] Bump `service-worker.js` `CACHE_NAME` (e.g. `v23` → `v24`)
- [ ] Update `CHANGELOG.md` with date-stamped entry
- [ ] `git status --short`  (no rogue files staged)
- [ ] Commit + `git push origin main`

## COMMIT MESSAGE STYLE

Multi-line, descriptive, with a "what + why" structure. Don't use `Co-Authored-By` unless explicitly asked. Example from the last shipping commit:

> Title: `+16 high-quality Jeopardy courses on top of Codex's all-subject base`
>
> Body explains: which courses, what makes them quality (named scientists, exam ties, alias counts), what infrastructure changed, what's deferred.

## SUCCESS METRICS

When you're done with Wave 4:

- ~46-50 courses in `games.json` by course-name
- Hub courses-band rail surfaces all of them with correct palette
- Validator <50 issues across full catalog
- All new courses match Global 10 quality bar on at least one spot-checked board
- Service Worker bumped to `v24`
- `CHANGELOG` documents the wave
- Pushed to `origin/main`
- Spot-checked one new-course Jeopardy board renders on iPhone 14 viewport

If you hit rate limits, fall back to inline building (skip sub-agents). If you run out of context, commit + push what you have and document remaining courses as a Wave 5 in the `CHANGELOG`.

Now go.
