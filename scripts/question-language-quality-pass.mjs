#!/usr/bin/env node
// =============================================================================
// Mr. Mac's Review Arcade — Language / Grammar / Clarity Quality Pass
//
// Walks every Jeopardy board, practice exam, and (samples) the compiled shared
// question bank. Runs a battery of language-quality checks on every clue /
// prompt / answer / choice / explanation, applies SAFE auto-fixes in place,
// and emits a per-file report at data/LANGUAGE_QUALITY_REPORT.md.
//
// Auto-fix philosophy: only modify a string when the fix is unambiguous.
//   * Common-typo denylist  (recieve → receive)            [SAFE]
//   * Double-space collapse                                 [SAFE]
//   * Leading/trailing whitespace strip                     [SAFE]
//   * Trailing period on Jeopardy short answers stripped    [SAFE]
//   * Naive apostrophe contraction repair (dont → don't)    [SAFE]
//   * Padded missing aliases to [answer]                    [SAFE]
//
// Everything else (terse stems, verbose stems, length-variance, weak
// explanations) is FLAGGED in the report for human review, never silently
// rewritten.
//
// Run:
//   node scripts/question-language-quality-pass.mjs           (write mode)
//   node scripts/question-language-quality-pass.mjs --check   (audit only)
// =============================================================================

import {
  readdirSync,
  readFileSync,
  writeFileSync,
  statSync,
  existsSync,
  mkdirSync,
} from "node:fs";
import { dirname, join, resolve, basename } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const GAMES = join(root, "games");
const DATA = join(root, "data");
const REPORT_PATH = join(DATA, "LANGUAGE_QUALITY_REPORT.md");
const SHARED_BANK_PATH = join(root, "assets", "shared-question-bank.js");

const SKIP_DIRS = new Set([
  "generated-jeopardy",
  "generated-practice-exam",
]);

const writeMode = !process.argv.includes("--check");

// ---------------------------------------------------------------------------
// Quality rules
// ---------------------------------------------------------------------------

// 1. Spelling denylist — unambiguous misspellings → auto-fix.
//    Keys are case-insensitive matches; value is the canonical replacement.
//    We preserve original casing of the first letter (Recieve → Receive).
const SPELLING_FIXES = [
  ["recieve", "receive"],
  ["recieved", "received"],
  ["recieving", "receiving"],
  ["seperate", "separate"],
  ["seperated", "separated"],
  ["seperating", "separating"],
  ["seperation", "separation"],
  ["definately", "definitely"],
  ["occured", "occurred"],
  ["occuring", "occurring"],
  ["occurance", "occurrence"],
  ["occurence", "occurrence"],
  ["untill", "until"],
  ["goverment", "government"],
  ["enviroment", "environment"],
  ["enviromental", "environmental"],
  ["commitee", "committee"],
  ["committe", "committee"],
  ["referal", "referral"],
  ["noticable", "noticeable"],
  ["independance", "independence"],
  ["accomodate", "accommodate"],
  ["accomodation", "accommodation"],
  ["recieves", "receives"],
  ["existance", "existence"],
  ["existant", "existent"],
  ["maintainance", "maintenance"],
  ["maintainence", "maintenance"],
  ["arguement", "argument"],
  ["acheive", "achieve"],
  ["acheived", "achieved"],
  ["acheivement", "achievement"],
  ["beleive", "believe"],
  ["beleived", "believed"],
  ["beleif", "belief"],
  ["concious", "conscious"],
  ["concience", "conscience"],
  ["embarass", "embarrass"],
  ["embarassed", "embarrassed"],
  ["embarassment", "embarrassment"],
  ["foriegn", "foreign"],
  ["gaurd", "guard"],
  ["gaurantee", "guarantee"],
  ["guarentee", "guarantee"],
  ["harrass", "harass"],
  ["harrassment", "harassment"],
  ["inteligence", "intelligence"],
  ["intelegent", "intelligent"],
  ["judgement", "judgment"], // US-preferred; both valid, we standardize
  ["lisence", "license"],
  ["liscense", "license"],
  ["maintainence", "maintenance"],
  ["mispell", "misspell"],
  ["neccessary", "necessary"],
  ["neccesary", "necessary"],
  ["necesary", "necessary"],
  ["occassion", "occasion"],
  ["occassional", "occasional"],
  ["occassionally", "occasionally"],
  ["paralell", "parallel"],
  ["parralel", "parallel"],
  ["parrallel", "parallel"],
  ["perseverence", "perseverance"],
  ["persistant", "persistent"],
  ["posession", "possession"],
  ["possesion", "possession"],
  ["preceeding", "preceding"],
  ["priviledge", "privilege"],
  ["privelege", "privilege"],
  ["publically", "publicly"],
  ["recomend", "recommend"],
  ["recomendation", "recommendation"],
  ["refered", "referred"],
  ["refering", "referring"],
  ["relevent", "relevant"],
  ["religous", "religious"],
  ["resistence", "resistance"],
  ["sucess", "success"],
  ["succes", "success"],
  ["sucessful", "successful"],
  ["succesful", "successful"],
  ["supercede", "supersede"],
  ["tendancy", "tendency"],
  ["truely", "truly"],
  ["tyrany", "tyranny"],
  ["wierd", "weird"],
  ["wether", "whether"], // careful: also could be "weather"; flag as ambiguous? prefer skip
  ["writting", "writing"],
  ["writen", "written"],
];
// remove "wether" since it can also mean a castrated sheep / "weather" — too ambiguous
const SPELLING_MAP = new Map(
  SPELLING_FIXES.filter(([bad]) => bad !== "wether").map(([bad, good]) => [bad.toLowerCase(), good])
);
const SPELLING_WORD_REGEX = new RegExp(
  "\\b(" + [...SPELLING_MAP.keys()].map(escapeRegex).join("|") + ")\\b",
  "gi"
);
function escapeRegex(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); }

// 2. Contraction repair — only fix unambiguous tokens, NOT "well" → "we'll" etc.
//    Format: missing-apostrophe → with-apostrophe
const CONTRACTION_FIXES = new Map([
  ["dont", "don't"],
  ["doesnt", "doesn't"],
  ["didnt", "didn't"],
  ["wont", "won't"],
  ["cant", "can't"],
  ["couldnt", "couldn't"],
  ["wouldnt", "wouldn't"],
  ["shouldnt", "shouldn't"],
  ["isnt", "isn't"],
  ["arent", "aren't"],
  ["wasnt", "wasn't"],
  ["werent", "weren't"],
  ["havent", "haven't"],
  ["hasnt", "hasn't"],
  ["hadnt", "hadn't"],
  ["theyre", "they're"],
  ["youre", "you're"],
  // Excluded — too ambiguous (could be a real word/name):
  //   "well" (we'll), "ill" (I'll), "shell" (she'll), "hell" (he'll),
  //   "were" (we're), "id" (I'd), "wed" (we'd), "youll" (rarely seen).
  ["theyve", "they've"],
  ["weve", "we've"],
  ["youve", "you've"],
  ["theyd", "they'd"],
  ["youd", "you'd"],
  ["thats", "that's"],
  ["whats", "what's"],
  ["wheres", "where's"],
  ["whens", "when's"],
  ["whos", "who's"],
  ["hows", "how's"],
  ["theres", "there's"],
  ["heres", "here's"],
  // EXCLUDED: "lets" — the verb is extremely common in CS / math /
  //   science explanations ("lets you compute", "lets glycolysis continue",
  //   "lets ions flow"), so the false-positive rate is 100% in our content.
]);
const CONTRACTION_WORD_REGEX = new RegExp(
  "\\b(" + [...CONTRACTION_FIXES.keys()].map(escapeRegex).join("|") + ")\\b",
  "g"
);

// 3. Common-name capitalization fixes (proper nouns / case-sensitive terms).
//    Applied with word-boundary, case-insensitive match → exact replacement.
const PROPER_NOUN_FIXES = new Map([
  ["newton", "Newton"],
  ["galileo", "Galileo"],
  ["pythagorean", "Pythagorean"],
  ["pythagoras", "Pythagoras"],
  ["einstein", "Einstein"],
  ["darwin", "Darwin"],
  ["mendel", "Mendel"],
  ["jefferson", "Jefferson"],
  ["lincoln", "Lincoln"],
  ["washington", "Washington"],
  // Note: be careful — these match anywhere in lowercase, so we restrict to
  // words preceded by a space or start-of-string and followed by space/punct.
]);
// We do NOT auto-apply proper-noun caps to avoid wreaking havoc inside URL-like
// or code-like tokens. Treat this as a flag-only list for now.

// 4. Stem length thresholds (flag-only).
const STEM_MIN_CHARS = 30;
const STEM_MAX_CHARS = 300;
const EXPLANATION_MIN_CHARS = 20;
const EXPLANATION_MAX_CHARS = 500;

// 5. Distractor length-variance threshold (flag-only).
//    If max(choice.length) > 4 * min(choice.length) AND max > 50 chars.
const DISTRACTOR_LENGTH_RATIO = 4;
const DISTRACTOR_MIN_LENGTH_FOR_FLAG = 50;

// ---------------------------------------------------------------------------
// Text helpers
// ---------------------------------------------------------------------------

// Apply a spelling-style replacement that preserves the original word's case
// pattern when possible. Examples:
//   recieve  → receive
//   Recieve  → Receive
//   RECIEVE  → RECEIVE
function applyCasedReplacement(originalToken, replacementLower) {
  if (originalToken === originalToken.toUpperCase() && /[A-Z]/.test(originalToken)) {
    return replacementLower.toUpperCase();
  }
  if (originalToken[0] === originalToken[0].toUpperCase()) {
    return replacementLower[0].toUpperCase() + replacementLower.slice(1);
  }
  return replacementLower;
}

// Returns { fixed, count } for spelling. Skipped on code-like strings.
function fixSpelling(str) {
  if (typeof str !== "string" || !str) return { fixed: str, count: 0 };
  if (looksLikeCode(str)) return { fixed: str, count: 0 };
  let count = 0;
  const out = str.replace(SPELLING_WORD_REGEX, (m) => {
    const repl = SPELLING_MAP.get(m.toLowerCase());
    if (!repl) return m;
    count += 1;
    return applyCasedReplacement(m, repl);
  });
  return { fixed: out, count };
}

// Heuristic: does this string look like non-English (French, Spanish, German,
// Italian, Latin) where these tokens may be legitimate words?
//   French:   "dont" (of which/whose), French accents and articles
//   Spanish:  diacritic ñ, ¿ ¡, articles like "el/la/los"
//   Latin:    "et", "in", "ad" (these are also English; weak signals)
// We use diacritic density + non-English function-word presence as a cheap
// proxy. Better to skip auto-fixing a borderline case than to corrupt
// foreign-language curriculum content.
const NON_ENGLISH_DIACRITICS_RE = /[àâäçéèêëîïôöùûüÿœÆ«»¿¡ñÑ]/;
// `g` flag is required so `String.match()` returns the count of distinct
// matches rather than the capture-group array.
const FRENCH_FUNCTION_WORDS_RE = /\b(le|la|les|des|du|une?|et|est|sont|qui|que|où|pour|avec|dans|sur|par|aussi|mais|très|c'est|n'est|d'un|d'une|cette|cet|ces|nous|vous|ils|elles|leur|leurs|son|sa|ses)\b/gi;
const SPANISH_FUNCTION_WORDS_RE = /\b(el|los|las|una?|unos|unas|del|para|por|con|pero|también|muy|cómo|donde|cuándo|porque|nosotros|vosotros|ellos|ellas|sus|tan|aunque)\b/gi;
// Note: "de" and "dont" removed from French list because "de" is a common
// English word (preposition fragment) and "dont" is the literal contraction
// we're trying to FIX in English — it would self-defeat. We rely on other
// French markers (les, des, est, qui, c'est, etc.) to identify French.
function looksLikeNonEnglish(str) {
  if (typeof str !== "string" || !str) return false;
  if (NON_ENGLISH_DIACRITICS_RE.test(str)) return true;
  // Count function-word matches via /g regex; require 2+ to call it non-English.
  const frenchCount = (str.match(FRENCH_FUNCTION_WORDS_RE) || []).length;
  const spanishCount = (str.match(SPANISH_FUNCTION_WORDS_RE) || []).length;
  return frenchCount + spanishCount >= 2;
}

// Returns { fixed, count } for contractions. Skipped entirely when the host
// string looks like non-English (where "dont" / "que" / etc. may be real
// French words, not missing-apostrophe contractions).
function fixContractions(str) {
  if (typeof str !== "string" || !str) return { fixed: str, count: 0 };
  if (looksLikeNonEnglish(str)) return { fixed: str, count: 0 };
  let count = 0;
  const out = str.replace(CONTRACTION_WORD_REGEX, (m) => {
    const repl = CONTRACTION_FIXES.get(m.toLowerCase());
    if (!repl) return m;
    // Preserve initial-cap if the original was capitalized.
    let final = repl;
    if (m[0] === m[0].toUpperCase()) {
      final = repl[0].toUpperCase() + repl.slice(1);
    }
    count += 1;
    return final;
  });
  return { fixed: out, count };
}

// Heuristic: looks like a table / column-aligned literal where double-spaces
// function as column separators (e.g., "x: 1, 2, 3  y: 4, 5, 6").
function looksLikeTabularData(str) {
  if (typeof str !== "string" || !str) return false;
  // Look for `letter:` followed by digits/commas followed by 2+ spaces followed
  // by another `letter:` — classic mini-table pattern.
  if (/[A-Za-z]:\s*[\d.,\s]+\s{2,}[A-Za-z]:/.test(str)) return true;
  return false;
}

// Heuristic: is this string likely to be a code block (Java/Python/etc.)?
// If yes, skip double-space fix entirely because indentation is meaningful.
function looksLikeCode(str) {
  if (typeof str !== "string" || !str) return false;
  // Code keywords / signatures
  if (/\b(public|private|protected|static|void|class|interface|new\s+[A-Z]\w*\s*\(|System\.out|println|ArrayList<|HashMap<|def\s+\w+\(|import\s+java|import\s+\w+\s*$)\b/.test(str)) return true;
  // Common code symbols + identifier patterns
  if (/\{[\s\S]*?[;]/.test(str)) return true; // brace + statement-end semicolon
  if (/for\s*\([^)]*;[^)]*;[^)]*\)/.test(str)) return true; // C-style for loop
  if (/\b\w+\.\w+\([^)]*\)\s*[;{]/.test(str)) return true; // method call with semi/brace
  if (/=>\s*[{(]/.test(str)) return true; // arrow function
  // Multi-line + indented continuation typical of code
  if (str.includes("\n")) {
    const lines = str.split("\n");
    // If any line after the first starts with 2+ spaces, treat as code indentation.
    const hasIndent = lines.slice(1).some((l) => /^ {2,}\S/.test(l));
    if (hasIndent) return true;
  }
  return false;
}

// Returns { fixed, count } for double-space collapse. Skipped on code-like
// strings (preserves indentation in AP CSA / AP CSP code prompts) and on
// table-like strings where double-space is a column separator.
function fixDoubleSpaces(str) {
  if (typeof str !== "string" || !str) return { fixed: str, count: 0 };
  if (looksLikeCode(str)) return { fixed: str, count: 0 };
  if (looksLikeTabularData(str)) return { fixed: str, count: 0 };
  let count = 0;
  const out = str.replace(/  +/g, () => { count += 1; return " "; });
  return { fixed: out, count };
}

// Returns { fixed, count } for leading/trailing whitespace strip. Skipped on
// code-like strings to preserve deliberate leading newlines / indentation.
function fixTrimWhitespace(str) {
  if (typeof str !== "string" || !str) return { fixed: str, count: 0 };
  if (looksLikeCode(str)) return { fixed: str, count: 0 };
  const trimmed = str.replace(/^\s+|\s+$/g, "");
  return { fixed: trimmed, count: trimmed === str ? 0 : 1 };
}

// Strip a trailing period from a short Jeopardy answer/choice that is not a
// full sentence. Heuristic: choice/answer < 60 chars, no internal sentence
// punctuation, ends with single period (not "..."), and contains no comma
// before final 5 chars.
function fixTrailingPeriodOnShortAnswer(str) {
  if (typeof str !== "string" || !str) return { fixed: str, count: 0 };
  const trimmed = str.trim();
  if (trimmed.length === 0 || trimmed.length > 60) return { fixed: str, count: 0 };
  if (!/\.$/.test(trimmed)) return { fixed: str, count: 0 };
  if (/\.\.\.?$/.test(trimmed)) return { fixed: str, count: 0 }; // ellipsis
  // If the text contains another sentence terminator (. ! ?), it is a sentence
  // — leave the period alone.
  const interior = trimmed.slice(0, -1);
  if (/[.!?]/.test(interior)) return { fixed: str, count: 0 };
  // If it ends with a known abbreviation (Dr., Mr., U.S., etc.) leave alone.
  if (/\b(Dr|Mr|Mrs|Ms|St|Sr|Jr|U\.S|U\.K|D\.C|e\.g|i\.e|etc|vs|cf|Inc|Ltd|Co|Corp|No|p|pp|Vol|Ch|Sec|Fig|Eq)\.$/i.test(trimmed)) {
    return { fixed: str, count: 0 };
  }
  // If it contains a verb pattern + at least 3 word boundaries (3+ words),
  // it's probably a complete sentence — leave the period alone.
  const wordCount = (trimmed.match(/\b\w+\b/g) || []).length;
  if (/\b(is|are|was|were|will|would|should|has|have|had|can|could|did|do|does|makes|made|gives|gave|forms|formed|shows|showed|means|meant|produces|produced|drives|drove|allows|allowed|enables|enabled|results|resulted)\b/i.test(trimmed) && wordCount >= 4) {
    return { fixed: str, count: 0 };
  }
  return { fixed: trimmed.slice(0, -1), count: 1 };
}

// Sentence-ending punctuation flag for prompts/explanations.
function isSentenceEnded(str) {
  if (typeof str !== "string" || !str) return false;
  return /[.!?]$|\?$|\.\.\.$|[\)\]"”’]$/.test(str.trim());
}

// Detect non-ASCII oddities (mojibake, smart-quote inconsistencies).
function detectMojibake(str) {
  if (typeof str !== "string" || !str) return false;
  // Common UTF-8-mis-decoded-as-Latin1 patterns
  return /Ã¢|Ã©|â€|Ã±|Ã¨|Ã ´/.test(str);
}

// World-language courses where bare tokens like "dont" / "que" / "el" are
// legitimate vocabulary, not missing-apostrophe contractions. We skip all
// spelling + contraction fixes on items inside these courses to avoid
// corrupting flashcard-style choice strings that may be a single foreign word.
const WORLD_LANGUAGE_DIR_PATTERN = /(french|spanish|latin|german|italian)/i;
function isWorldLanguageDir(dirSlug) {
  return typeof dirSlug === "string" && WORLD_LANGUAGE_DIR_PATTERN.test(dirSlug);
}

// ---------------------------------------------------------------------------
// SAFE field-level fixer used by every per-item walk.
// Returns { fixed, fixesByCategory }
// ---------------------------------------------------------------------------
function safeFixString(str, opts = {}) {
  // opts: { isShortAnswer: bool, isWorldLanguage: bool }
  //   isShortAnswer    — allow trailing-period strip on short choice/answer
  //   isWorldLanguage  — skip spelling + contraction fixes (foreign vocab)
  const fixesByCategory = {
    spelling: 0,
    contractions: 0,
    doubleSpaces: 0,
    trim: 0,
    trailingPeriod: 0,
  };
  if (typeof str !== "string") return { fixed: str, fixesByCategory };
  let cur = str;

  if (!opts.isWorldLanguage) {
    const a = fixSpelling(cur); cur = a.fixed; fixesByCategory.spelling += a.count;
    const b = fixContractions(cur); cur = b.fixed; fixesByCategory.contractions += b.count;
  }
  const c = fixDoubleSpaces(cur); cur = c.fixed; fixesByCategory.doubleSpaces += c.count;
  const d = fixTrimWhitespace(cur); cur = d.fixed; fixesByCategory.trim += d.count;

  if (opts.isShortAnswer) {
    const e = fixTrailingPeriodOnShortAnswer(cur);
    cur = e.fixed;
    fixesByCategory.trailingPeriod += e.count;
  }

  return { fixed: cur, fixesByCategory };
}

// ---------------------------------------------------------------------------
// Flag generators (do not auto-fix; pile into report).
// ---------------------------------------------------------------------------
function flagsForPrompt(prompt, location) {
  const flags = [];
  if (typeof prompt !== "string") return [{ kind: "prompt-missing", location }];
  const len = prompt.trim().length;
  if (len < STEM_MIN_CHARS) {
    flags.push({ kind: "prompt-too-terse", location, detail: `${len} chars (<${STEM_MIN_CHARS})`, sample: prompt.slice(0, 80) });
  }
  if (len > STEM_MAX_CHARS) {
    flags.push({ kind: "prompt-too-verbose", location, detail: `${len} chars (>${STEM_MAX_CHARS})`, sample: prompt.slice(0, 80) });
  }
  if (!isSentenceEnded(prompt)) {
    flags.push({ kind: "prompt-missing-end-punct", location, sample: prompt.slice(-40) });
  }
  if (detectMojibake(prompt)) {
    flags.push({ kind: "mojibake", location, field: "prompt", sample: prompt.slice(0, 80) });
  }
  return flags;
}

function flagsForExplanation(explanation, location) {
  const flags = [];
  if (typeof explanation !== "string") return [{ kind: "explanation-missing", location }];
  const len = explanation.trim().length;
  if (len < EXPLANATION_MIN_CHARS) {
    flags.push({ kind: "explanation-too-terse", location, detail: `${len} chars (<${EXPLANATION_MIN_CHARS})`, sample: explanation.slice(0, 80) });
  }
  if (len > EXPLANATION_MAX_CHARS) {
    flags.push({ kind: "explanation-too-verbose", location, detail: `${len} chars (>${EXPLANATION_MAX_CHARS})`, sample: explanation.slice(0, 80) });
  }
  if (!isSentenceEnded(explanation)) {
    flags.push({ kind: "explanation-missing-end-punct", location, sample: explanation.slice(-40) });
  }
  if (detectMojibake(explanation)) {
    flags.push({ kind: "mojibake", location, field: "explanation", sample: explanation.slice(0, 80) });
  }
  return flags;
}

function flagsForChoices(choices, correctText, location) {
  const flags = [];
  if (!Array.isArray(choices)) return [{ kind: "choices-not-array", location }];
  // Length variance
  const lengths = choices.map((c) => (typeof c === "string" ? c.length : 0));
  const min = Math.min(...lengths);
  const max = Math.max(...lengths);
  if (max >= DISTRACTOR_MIN_LENGTH_FOR_FLAG && min > 0 && max / min >= DISTRACTOR_LENGTH_RATIO) {
    flags.push({
      kind: "choices-length-variance",
      location,
      detail: `min=${min}, max=${max}, ratio=${(max/min).toFixed(1)}`,
    });
  }
  // Correct-text-not-in-choices
  if (typeof correctText === "string" && !choices.includes(correctText)) {
    // Try trimmed match
    const trimmedMatch = choices.find((c) => typeof c === "string" && c.trim() === correctText.trim());
    if (!trimmedMatch) {
      flags.push({
        kind: "correctText-not-in-choices",
        location,
        detail: `correctText=${JSON.stringify(correctText.slice(0, 60))}, choices=[${choices.map((c) => JSON.stringify((c || "").slice(0, 30))).join(", ")}]`,
      });
    }
  }
  // Mojibake in any choice
  choices.forEach((c, i) => {
    if (detectMojibake(c)) {
      flags.push({ kind: "mojibake", location, field: `choice[${i}]`, sample: String(c).slice(0, 80) });
    }
  });
  return flags;
}

function flagsForJeopardyClue(cl, location) {
  const flags = [];
  const clueText = cl?.clue;
  const answerText = cl?.answer;
  const explanation = cl?.explanation;
  if (typeof clueText === "string") {
    const len = clueText.trim().length;
    // Jeopardy clues can be shorter (Q-like fragments). Use 12-char floor.
    if (len < 12) flags.push({ kind: "clue-too-terse", location, detail: `${len} chars`, sample: clueText });
    if (len > STEM_MAX_CHARS) flags.push({ kind: "clue-too-verbose", location, detail: `${len} chars`, sample: clueText.slice(0, 80) });
    if (detectMojibake(clueText)) flags.push({ kind: "mojibake", location, field: "clue", sample: clueText.slice(0, 80) });
  } else {
    flags.push({ kind: "clue-missing", location });
  }
  if (typeof answerText !== "string" || !answerText.trim()) {
    flags.push({ kind: "answer-missing", location });
  } else if (detectMojibake(answerText)) {
    flags.push({ kind: "mojibake", location, field: "answer", sample: answerText.slice(0, 80) });
  }
  // Confirm answer is in aliases (after fix pass)
  if (Array.isArray(cl?.aliases) && typeof answerText === "string") {
    const aliasesLower = cl.aliases.map((a) => String(a).toLowerCase().trim());
    if (!aliasesLower.includes(answerText.toLowerCase().trim())) {
      // Only flag if it's not even a substring match in any alias
      const close = cl.aliases.find((a) => {
        const al = String(a).toLowerCase().trim();
        return al.includes(answerText.toLowerCase().trim()) || answerText.toLowerCase().trim().includes(al);
      });
      if (!close) {
        flags.push({
          kind: "answer-not-in-aliases",
          location,
          detail: `answer=${JSON.stringify(answerText.slice(0, 40))} not in aliases=[${cl.aliases.slice(0, 3).map((a) => JSON.stringify(String(a).slice(0, 20))).join(", ")}]`,
        });
      }
    }
  }
  if (typeof explanation === "string") {
    const len = explanation.trim().length;
    if (len < EXPLANATION_MIN_CHARS) flags.push({ kind: "explanation-too-terse", location, detail: `${len} chars`, sample: explanation.slice(0, 80) });
    if (len > EXPLANATION_MAX_CHARS) flags.push({ kind: "explanation-too-verbose", location, detail: `${len} chars`, sample: explanation.slice(0, 80) });
    if (!isSentenceEnded(explanation)) flags.push({ kind: "explanation-missing-end-punct", location, sample: explanation.slice(-40) });
    if (detectMojibake(explanation)) flags.push({ kind: "mojibake", location, field: "explanation", sample: explanation.slice(0, 80) });
  }
  return flags;
}

// ---------------------------------------------------------------------------
// Brace-walker for Jeopardy GAME object (copied/adapted from audit-jeopardy-boards.mjs).
// ---------------------------------------------------------------------------
function extractGameJsonRange(text) {
  const startMarker = "const GAME = ";
  const idx = text.indexOf(startMarker);
  if (idx === -1) return null;
  let i = idx + startMarker.length;
  while (i < text.length && text[i] !== "{") i++;
  if (i >= text.length) return null;
  const start = i;
  let depth = 0;
  let inStr = false;
  let strQuote = "";
  let escape = false;
  for (; i < text.length; i++) {
    const ch = text[i];
    if (inStr) {
      if (escape) { escape = false; continue; }
      if (ch === "\\") { escape = true; continue; }
      if (ch === strQuote) { inStr = false; strQuote = ""; continue; }
      continue;
    }
    if (ch === '"' || ch === "'") { inStr = true; strQuote = ch; continue; }
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return { start, end: i + 1 };
    }
  }
  return null;
}

function extractGame(text) {
  const range = extractGameJsonRange(text);
  if (!range) return { ok: false, error: "missing_game_block" };
  const json = text.slice(range.start, range.end);
  try { return { ok: true, game: JSON.parse(json), range, json }; }
  catch (e) { return { ok: false, error: "parse_error", message: e.message, range, json }; }
}

// Defensive re-serializer (same as audit-jeopardy-boards): rewrites `};`
// substrings INSIDE string literals → `} ;` so downstream regex extractors
// don't trip.
function serializeReplacement(originalText, range, newGame) {
  const before = originalText.slice(0, range.start);
  const after = originalText.slice(range.end);
  let json = JSON.stringify(newGame);
  const out = [];
  let inStr = false;
  let escape = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    const next = json[i + 1];
    if (inStr) {
      if (escape) { out.push(ch); escape = false; continue; }
      if (ch === "\\") { out.push(ch); escape = true; continue; }
      if (ch === '"') { out.push(ch); inStr = false; continue; }
      if (ch === "}" && next === ";") { out.push("} "); continue; }
      out.push(ch);
      continue;
    }
    if (ch === '"') { out.push(ch); inStr = true; continue; }
    out.push(ch);
  }
  return before + out.join("") + after;
}

// ---------------------------------------------------------------------------
// Practice exam — splitter + JS eval (adapted from audit-practice-exams.mjs).
// ---------------------------------------------------------------------------
function splitPracticeFile(source) {
  const startMatch = source.match(/^const QUESTIONS = \[\s*\n/m);
  if (!startMatch) throw new Error("missing `const QUESTIONS = [` opener");
  const startIndex = startMatch.index;
  const headEnd = startIndex + startMatch[0].length;
  const tailMatch = source.slice(headEnd).match(/^\];\s*\n/m);
  if (!tailMatch) throw new Error("missing closing `];` after QUESTIONS");
  const tailIndex = headEnd + tailMatch.index;
  const tailEnd = tailIndex + tailMatch[0].length;
  const head = source.slice(0, startIndex);
  const scriptOpenIdx = head.lastIndexOf("<script>");
  const preamble = scriptOpenIdx >= 0 ? head.slice(scriptOpenIdx + "<script>".length) : "";
  return {
    head,
    preamble,
    arrayPrefix: source.slice(startIndex, headEnd),
    body: source.slice(headEnd, tailIndex),
    arraySuffix: source.slice(tailIndex, tailEnd),
    tail: source.slice(tailEnd),
  };
}

function evalPracticeQuestions(preamble, arrayPrefix, body, arraySuffix) {
  const wrapped = `${preamble}\nglobalThis.__QUESTIONS = ${arrayPrefix.slice("const QUESTIONS = ".length)}${body}${arraySuffix.replace(/;\s*$/, ";")}`;
  const noopProxy = new Proxy(function () {}, {
    get: () => noopProxy,
    apply: () => noopProxy,
    construct: () => ({}),
  });
  const sandbox = {
    document: noopProxy,
    window: noopProxy,
    navigator: { language: "en-US", languages: ["en-US"] },
    localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
    console: { log() {}, warn() {}, error() {} },
  };
  vm.createContext(sandbox);
  vm.runInContext(wrapped, sandbox, { filename: "QUESTIONS.eval.js" });
  if (!Array.isArray(sandbox.__QUESTIONS)) throw new Error("eval did not yield array");
  return sandbox.__QUESTIONS;
}

// Re-serialize a practice question to the existing arcade format.
function escapeStringForJs(str) {
  return `"${String(str)
    .replace(/\\/g, "\\\\")
    .replace(/"/g, "\\\"")
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
  }"`;
}

function serializePracticeQuestion(q, indent = "  ") {
  const inner = indent + "  ";
  const choicesBlock = q.choices.map((c) => `${inner}  ${escapeStringForJs(c)},`).join("\n");
  return [
    `${indent}{`,
    `${inner}id: ${escapeStringForJs(q.id)},`,
    `${inner}topic: ${escapeStringForJs(q.topic)},`,
    `${inner}prompt: ${escapeStringForJs(q.prompt)},`,
    `${inner}choices: [`,
    choicesBlock,
    `${inner}],`,
    `${inner}correctText: ${escapeStringForJs(q.correctText)},`,
    `${inner}explanation: ${escapeStringForJs(q.explanation)}`,
    `${indent}}`,
  ].join("\n");
}

// ---------------------------------------------------------------------------
// File walker
// ---------------------------------------------------------------------------
function listJeopardyFiles() {
  const out = [];
  for (const entry of readdirSync(GAMES)) {
    if (SKIP_DIRS.has(entry)) continue;
    const dir = join(GAMES, entry);
    let st;
    try { st = statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    for (const f of readdirSync(dir)) {
      if (!f.endsWith(".html")) continue;
      if (f === "index.html") continue;
      if (f === "practice-exam.html") continue; // handled separately
      if (f.startsWith("._")) continue;
      const full = join(dir, f);
      const head = readFileSync(full, "utf8");
      if (!head.includes("const GAME = {")) continue;
      out.push({ dirSlug: entry, file: f, path: full });
    }
  }
  return out.sort((a, b) => a.path.localeCompare(b.path));
}

function listPracticeExamFiles() {
  const out = [];
  for (const entry of readdirSync(GAMES)) {
    if (SKIP_DIRS.has(entry)) continue;
    const dir = join(GAMES, entry);
    let st;
    try { st = statSync(dir); } catch { continue; }
    if (!st.isDirectory()) continue;
    const examPath = join(dir, "practice-exam.html");
    try {
      if (statSync(examPath).isFile()) out.push({ slug: entry, path: examPath });
    } catch { /* none */ }
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug));
}

// ---------------------------------------------------------------------------
// Per-file Jeopardy walker
// ---------------------------------------------------------------------------
function processJeopardyFile(filePath, dirSlug, fileName) {
  const result = {
    path: filePath,
    relPath: filePath.replace(root + "/", ""),
    type: "jeopardy",
    itemsAudited: 0,
    autoFixes: {
      spelling: 0,
      contractions: 0,
      doubleSpaces: 0,
      trim: 0,
      trailingPeriod: 0,
      aliasesPadded: 0,
    },
    flags: [],
    modified: false,
    skipped: null,
  };
  const isWorldLanguage = isWorldLanguageDir(dirSlug);
  const text = readFileSync(filePath, "utf8");
  const ext = extractGame(text);
  if (!ext.ok) {
    result.skipped = `parse: ${ext.error}${ext.message ? ` (${ext.message})` : ""}`;
    return result;
  }
  const game = ext.game;
  if (!game || typeof game !== "object" || !Array.isArray(game.categories)) {
    result.skipped = "GAME has no categories array";
    return result;
  }

  // Walk each clue (5 cats × 5 clues = 25 items per board) + Final.
  game.categories.forEach((cat, ci) => {
    if (!cat || !Array.isArray(cat.clues)) return;
    cat.clues.forEach((cl, qi) => {
      if (!cl || typeof cl !== "object") return;
      result.itemsAudited += 1;
      const loc = `cat[${ci}].clue[${qi}] (value ${cl.value || "?"})`;

      // Safe field fixes
      const fixClue = safeFixString(cl.clue, { isShortAnswer: false, isWorldLanguage });
      cl.clue = fixClue.fixed;
      const fixAnswer = safeFixString(cl.answer, { isShortAnswer: true, isWorldLanguage });
      cl.answer = fixAnswer.fixed;
      const fixExpl = safeFixString(cl.explanation, { isShortAnswer: false, isWorldLanguage });
      cl.explanation = fixExpl.fixed;
      // Aliases: fix each + pad to [answer] if missing.
      if (Array.isArray(cl.aliases)) {
        cl.aliases = cl.aliases.map((a) => {
          if (typeof a !== "string") return a;
          const f = safeFixString(a, { isShortAnswer: true, isWorldLanguage });
          for (const k of Object.keys(result.autoFixes)) {
            if (k in f.fixesByCategory) result.autoFixes[k] += f.fixesByCategory[k];
          }
          return f.fixed;
        });
      }
      if (!Array.isArray(cl.aliases) || cl.aliases.length === 0) {
        if (typeof cl.answer === "string" && cl.answer.trim()) {
          cl.aliases = [cl.answer];
          result.autoFixes.aliasesPadded += 1;
        }
      } else if (typeof cl.answer === "string" && cl.answer.trim()) {
        // If the canonical answer isn't already in aliases (case-insensitive
        // trimmed compare), add it so user input matching the exact answer
        // always succeeds.
        const answerNorm = cl.answer.toLowerCase().trim();
        const inAliases = cl.aliases.some((a) => typeof a === "string" && a.toLowerCase().trim() === answerNorm);
        if (!inAliases) {
          cl.aliases.push(cl.answer);
          result.autoFixes.aliasesPadded += 1;
        }
      }
      // Tally fixes on the main fields
      for (const k of Object.keys(fixClue.fixesByCategory)) {
        result.autoFixes[k] += fixClue.fixesByCategory[k];
      }
      for (const k of Object.keys(fixAnswer.fixesByCategory)) {
        result.autoFixes[k] += fixAnswer.fixesByCategory[k];
      }
      for (const k of Object.keys(fixExpl.fixesByCategory)) {
        result.autoFixes[k] += fixExpl.fixesByCategory[k];
      }

      // Flags
      const fl = flagsForJeopardyClue(cl, loc);
      for (const f of fl) result.flags.push(f);
    });
  });

  // Final
  if (game.final && typeof game.final === "object") {
    const f = game.final;
    result.itemsAudited += 1;
    const loc = "final";
    const fixCat = safeFixString(f.category, { isShortAnswer: true, isWorldLanguage });
    f.category = fixCat.fixed;
    const fixClue = safeFixString(f.clue, { isShortAnswer: false, isWorldLanguage });
    f.clue = fixClue.fixed;
    const fixAnswer = safeFixString(f.answer, { isShortAnswer: true, isWorldLanguage });
    f.answer = fixAnswer.fixed;
    const fixExpl = safeFixString(f.explanation, { isShortAnswer: false, isWorldLanguage });
    f.explanation = fixExpl.fixed;
    if (Array.isArray(f.aliases)) {
      f.aliases = f.aliases.map((a) => {
        if (typeof a !== "string") return a;
        const ff = safeFixString(a, { isShortAnswer: true, isWorldLanguage });
        for (const k of Object.keys(result.autoFixes)) {
          if (k in ff.fixesByCategory) result.autoFixes[k] += ff.fixesByCategory[k];
        }
        return ff.fixed;
      });
    }
    if (!Array.isArray(f.aliases) || f.aliases.length === 0) {
      if (typeof f.answer === "string" && f.answer.trim()) {
        f.aliases = [f.answer];
        result.autoFixes.aliasesPadded += 1;
      }
    } else if (typeof f.answer === "string" && f.answer.trim()) {
      const answerNorm = f.answer.toLowerCase().trim();
      const inAliases = f.aliases.some((a) => typeof a === "string" && a.toLowerCase().trim() === answerNorm);
      if (!inAliases) {
        f.aliases.push(f.answer);
        result.autoFixes.aliasesPadded += 1;
      }
    }
    for (const k of Object.keys(fixCat.fixesByCategory)) result.autoFixes[k] += fixCat.fixesByCategory[k];
    for (const k of Object.keys(fixClue.fixesByCategory)) result.autoFixes[k] += fixClue.fixesByCategory[k];
    for (const k of Object.keys(fixAnswer.fixesByCategory)) result.autoFixes[k] += fixAnswer.fixesByCategory[k];
    for (const k of Object.keys(fixExpl.fixesByCategory)) result.autoFixes[k] += fixExpl.fixesByCategory[k];

    // Flags for final
    if (typeof f.clue === "string") {
      const len = f.clue.trim().length;
      if (len < 20) result.flags.push({ kind: "final-clue-too-terse", location: loc, detail: `${len} chars` });
      if (len > STEM_MAX_CHARS) result.flags.push({ kind: "final-clue-too-verbose", location: loc, detail: `${len} chars` });
    }
    if (typeof f.explanation === "string") {
      const len = f.explanation.trim().length;
      if (len < EXPLANATION_MIN_CHARS) result.flags.push({ kind: "final-explanation-too-terse", location: loc, detail: `${len} chars` });
      if (len > EXPLANATION_MAX_CHARS) result.flags.push({ kind: "final-explanation-too-verbose", location: loc, detail: `${len} chars` });
      if (!isSentenceEnded(f.explanation)) result.flags.push({ kind: "final-explanation-missing-end-punct", location: loc, sample: f.explanation.slice(-40) });
    }
  }

  const totalAutoFixes =
    result.autoFixes.spelling +
    result.autoFixes.contractions +
    result.autoFixes.doubleSpaces +
    result.autoFixes.trim +
    result.autoFixes.trailingPeriod +
    result.autoFixes.aliasesPadded;

  if (totalAutoFixes > 0 && writeMode) {
    const newText = serializeReplacement(text, ext.range, game);
    if (newText !== text) {
      writeFileSync(filePath, newText, "utf8");
      result.modified = true;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Per-file practice-exam walker
// ---------------------------------------------------------------------------
function processPracticeExamFile(filePath, slug) {
  const result = {
    path: filePath,
    relPath: filePath.replace(root + "/", ""),
    type: "practice-exam",
    itemsAudited: 0,
    autoFixes: {
      spelling: 0,
      contractions: 0,
      doubleSpaces: 0,
      trim: 0,
      trailingPeriod: 0,
      aliasesPadded: 0,
    },
    flags: [],
    modified: false,
    skipped: null,
  };

  const isWorldLanguage = isWorldLanguageDir(slug);
  const source = readFileSync(filePath, "utf8");
  let parts;
  try {
    parts = splitPracticeFile(source);
  } catch (err) {
    result.skipped = `split: ${err.message}`;
    return result;
  }
  let questions;
  try {
    questions = evalPracticeQuestions(parts.preamble, parts.arrayPrefix, parts.body, parts.arraySuffix);
  } catch (err) {
    result.skipped = `eval: ${err.message}`;
    return result;
  }

  let anyFix = false;
  questions.forEach((q, qi) => {
    if (!q || typeof q !== "object") return;
    result.itemsAudited += 1;
    const loc = `q[${qi}] id=${q.id || "?"}`;

    // Safe field fixes
    const fixPrompt = safeFixString(q.prompt, { isShortAnswer: false, isWorldLanguage });
    q.prompt = fixPrompt.fixed;
    const fixExpl = safeFixString(q.explanation, { isShortAnswer: false, isWorldLanguage });
    q.explanation = fixExpl.fixed;
    if (Array.isArray(q.choices)) {
      q.choices = q.choices.map((c) => {
        // Practice-exam distractors/choices are often full sentences,
        // so we do NOT strip trailing periods on these. Only spelling /
        // contractions / spaces / trim.
        const f = safeFixString(c, { isShortAnswer: false, isWorldLanguage });
        for (const k of Object.keys(result.autoFixes)) {
          if (k in f.fixesByCategory) result.autoFixes[k] += f.fixesByCategory[k];
        }
        return f.fixed;
      });
    }
    // correctText follows the same rule (no trailing-period strip).
    const fixCorrect = safeFixString(q.correctText, { isShortAnswer: false, isWorldLanguage });
    q.correctText = fixCorrect.fixed;

    for (const k of Object.keys(fixPrompt.fixesByCategory)) result.autoFixes[k] += fixPrompt.fixesByCategory[k];
    for (const k of Object.keys(fixExpl.fixesByCategory)) result.autoFixes[k] += fixExpl.fixesByCategory[k];
    for (const k of Object.keys(fixCorrect.fixesByCategory)) result.autoFixes[k] += fixCorrect.fixesByCategory[k];

    // Flags
    for (const f of flagsForPrompt(q.prompt, loc)) result.flags.push(f);
    for (const f of flagsForExplanation(q.explanation, loc)) result.flags.push(f);
    for (const f of flagsForChoices(q.choices, q.correctText, loc)) result.flags.push(f);
  });

  const totalAutoFixes =
    result.autoFixes.spelling +
    result.autoFixes.contractions +
    result.autoFixes.doubleSpaces +
    result.autoFixes.trim +
    result.autoFixes.trailingPeriod +
    result.autoFixes.aliasesPadded;

  if (totalAutoFixes > 0 && writeMode) {
    // Rebuild only the body, preserve head/preamble/arrayPrefix/suffix/tail.
    const newBody = questions
      .map((q) => serializePracticeQuestion(q, "  "))
      .join(",\n") + (questions.length ? ",\n" : "");
    const newSource = `${parts.head}${parts.arrayPrefix}${newBody}${parts.arraySuffix}${parts.tail}`;
    if (newSource !== source) {
      writeFileSync(filePath, newSource, "utf8");
      result.modified = true;
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Shared bank sampler (read-only check; flag-only report).
// The shared bank is auto-generated from the source files, so any fix made
// upstream will propagate the next time `npm run bank` runs. Therefore we
// only AUDIT the bank — never modify it.
// ---------------------------------------------------------------------------
function sampleSharedBank() {
  const result = {
    path: SHARED_BANK_PATH,
    relPath: "assets/shared-question-bank.js",
    type: "shared-bank-sample",
    itemsAudited: 0,
    autoFixes: { spelling: 0, contractions: 0, doubleSpaces: 0, trim: 0, trailingPeriod: 0, aliasesPadded: 0 },
    flags: [],
    modified: false,
    skipped: null,
  };
  if (!existsSync(SHARED_BANK_PATH)) {
    result.skipped = "shared bank file missing";
    return result;
  }
  let text;
  try {
    text = readFileSync(SHARED_BANK_PATH, "utf8");
  } catch (err) {
    result.skipped = `read: ${err.message}`;
    return result;
  }
  // The file format is an IIFE assigning w.DIAG_BANK_BY_COURSE = { course: [ {...}, ... ], ... };
  // The IIFE invokes itself with `typeof window !== "undefined" ? window : globalThis`,
  // so we provide a `window` global to capture the assignments.
  const sandbox = { window: {} };
  try {
    vm.createContext(sandbox);
    vm.runInContext(text, sandbox, { filename: "shared-question-bank.js" });
  } catch (err) {
    result.skipped = `eval: ${err.message}`;
    return result;
  }
  const bank = sandbox.window.DIAG_BANK_BY_COURSE;
  if (!bank || typeof bank !== "object") {
    result.skipped = "bank exposed no DIAG_BANK_BY_COURSE";
    return result;
  }
  // Sample: 5 random questions from each course.
  const SAMPLE_PER_COURSE = 5;
  for (const courseId of Object.keys(bank)) {
    const list = bank[courseId];
    if (!Array.isArray(list) || list.length === 0) continue;
    const stride = Math.max(1, Math.floor(list.length / SAMPLE_PER_COURSE));
    for (let i = 0; i < list.length && i < SAMPLE_PER_COURSE * stride; i += stride) {
      const q = list[i];
      if (!q || typeof q !== "object") continue;
      result.itemsAudited += 1;
      const loc = `${courseId}.q[${i}] id=${q.id || "?"}`;

      // Spelling/contraction/space scan — flag if it would have been auto-fixed.
      const sp = fixSpelling(q.prompt || "");
      if (sp.count > 0) result.flags.push({ kind: "bank-prompt-spelling", location: loc, detail: `${sp.count} fixes pending — re-run npm run bank after main pass.`, sample: q.prompt.slice(0, 80) });
      const co = fixContractions(q.prompt || "");
      if (co.count > 0) result.flags.push({ kind: "bank-prompt-contractions", location: loc, detail: `${co.count} fixes pending`, sample: q.prompt.slice(0, 80) });
      const sp2 = fixSpelling(q.explanation || "");
      if (sp2.count > 0) result.flags.push({ kind: "bank-explanation-spelling", location: loc, detail: `${sp2.count} fixes pending`, sample: (q.explanation || "").slice(0, 80) });

      // Standard flag set
      for (const f of flagsForPrompt(q.prompt, loc)) result.flags.push(f);
      for (const f of flagsForExplanation(q.explanation, loc)) result.flags.push(f);
      for (const f of flagsForChoices(q.choices, q.correctText, loc)) result.flags.push(f);
    }
  }
  return result;
}

// ---------------------------------------------------------------------------
// Report writer
// ---------------------------------------------------------------------------
function writeReport(allResults, stats) {
  const lines = [];
  lines.push("# Language / Grammar / Clarity Quality Pass — Report");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push(`Mode: ${writeMode ? "WRITE (auto-fixes applied)" : "CHECK (audit only)"}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`* Files audited:                **${stats.filesAudited}**`);
  lines.push(`* Files modified (auto-fix applied): **${stats.filesModified}**`);
  lines.push(`* Files skipped (parse/eval error):  **${stats.filesSkipped}**`);
  lines.push(`* Total items audited:           **${stats.itemsAudited}**`);
  lines.push("");
  lines.push("### Auto-fixes by category");
  lines.push("");
  lines.push(`* Spelling fixes:           ${stats.totalAutoFixes.spelling}`);
  lines.push(`* Contraction repairs:      ${stats.totalAutoFixes.contractions}`);
  lines.push(`* Double-space collapses:   ${stats.totalAutoFixes.doubleSpaces}`);
  lines.push(`* Leading/trailing trims:   ${stats.totalAutoFixes.trim}`);
  lines.push(`* Trailing-period strips:   ${stats.totalAutoFixes.trailingPeriod}`);
  lines.push(`* Aliases padded:           ${stats.totalAutoFixes.aliasesPadded}`);
  lines.push(`* **Total auto-fixes:**     **${stats.totalAutoFixesAll}**`);
  lines.push("");
  lines.push("### Flags for human review (not auto-fixed)");
  lines.push("");
  for (const [kind, count] of Object.entries(stats.flagCountsByKind).sort((a, b) => b[1] - a[1])) {
    lines.push(`* \`${kind}\`: ${count}`);
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Skipped files (could not parse/eval)");
  lines.push("");
  const skipped = allResults.filter((r) => r.skipped);
  if (skipped.length === 0) {
    lines.push("_(none — every file parsed cleanly)_");
  } else {
    for (const r of skipped) {
      lines.push(`* \`${r.relPath}\` — ${r.skipped}`);
    }
  }
  lines.push("");
  lines.push("---");
  lines.push("");
  lines.push("## Per-file flags");
  lines.push("");
  lines.push("Only files with ≥1 flag are listed. Each flag shows kind + location + sample.");
  lines.push("");
  const flagged = allResults
    .filter((r) => r.flags.length > 0)
    .sort((a, b) => b.flags.length - a.flags.length);
  if (flagged.length === 0) {
    lines.push("_(none — every audited item passed all clarity heuristics)_");
  } else {
    for (const r of flagged) {
      lines.push(`### \`${r.relPath}\` — ${r.flags.length} flag(s), ${r.itemsAudited} items audited`);
      lines.push("");
      // Group flags by kind for readability
      const byKind = new Map();
      for (const f of r.flags) {
        if (!byKind.has(f.kind)) byKind.set(f.kind, []);
        byKind.get(f.kind).push(f);
      }
      for (const [kind, flagsOfKind] of byKind) {
        lines.push(`* **${kind}** (${flagsOfKind.length})`);
        for (const f of flagsOfKind.slice(0, 8)) {
          let line = `  * ${f.location}`;
          if (f.detail) line += ` — ${f.detail}`;
          if (f.sample) line += ` · sample: \`${String(f.sample).replace(/`/g, "'").slice(0, 80)}\``;
          if (f.field) line += ` · field: ${f.field}`;
          lines.push(line);
        }
        if (flagsOfKind.length > 8) {
          lines.push(`  * ... and ${flagsOfKind.length - 8} more`);
        }
      }
      lines.push("");
    }
  }
  lines.push("---");
  lines.push("");
  lines.push("_End of report._");

  if (!existsSync(DATA)) mkdirSync(DATA, { recursive: true });
  writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
function main() {
  const t0 = Date.now();
  const jeopardyFiles = listJeopardyFiles();
  const practiceFiles = listPracticeExamFiles();
  console.log(`Auditing ${jeopardyFiles.length} Jeopardy boards + ${practiceFiles.length} practice exams.`);
  console.log(`Mode: ${writeMode ? "WRITE" : "CHECK"}`);
  console.log("");

  const allResults = [];

  // Jeopardy pass
  let jProgress = 0;
  for (const { dirSlug, file, path } of jeopardyFiles) {
    const r = processJeopardyFile(path, dirSlug, file);
    allResults.push(r);
    jProgress += 1;
    if (jProgress % 50 === 0) {
      console.log(`  ... jeopardy ${jProgress}/${jeopardyFiles.length}`);
    }
  }

  // Practice-exam pass
  let pProgress = 0;
  for (const { slug, path } of practiceFiles) {
    const r = processPracticeExamFile(path, slug);
    allResults.push(r);
    pProgress += 1;
    if (pProgress % 10 === 0) {
      console.log(`  ... practice ${pProgress}/${practiceFiles.length}`);
    }
  }

  // Shared bank sample
  console.log("Sampling shared bank...");
  const bankResult = sampleSharedBank();
  allResults.push(bankResult);

  // Stats
  const stats = {
    filesAudited: allResults.length,
    filesModified: allResults.filter((r) => r.modified).length,
    filesSkipped: allResults.filter((r) => r.skipped).length,
    itemsAudited: allResults.reduce((s, r) => s + r.itemsAudited, 0),
    totalAutoFixes: { spelling: 0, contractions: 0, doubleSpaces: 0, trim: 0, trailingPeriod: 0, aliasesPadded: 0 },
    totalAutoFixesAll: 0,
    flagCountsByKind: {},
  };
  for (const r of allResults) {
    for (const k of Object.keys(stats.totalAutoFixes)) {
      stats.totalAutoFixes[k] += (r.autoFixes && r.autoFixes[k]) || 0;
    }
    for (const f of r.flags) {
      stats.flagCountsByKind[f.kind] = (stats.flagCountsByKind[f.kind] || 0) + 1;
    }
  }
  stats.totalAutoFixesAll =
    stats.totalAutoFixes.spelling +
    stats.totalAutoFixes.contractions +
    stats.totalAutoFixes.doubleSpaces +
    stats.totalAutoFixes.trim +
    stats.totalAutoFixes.trailingPeriod +
    stats.totalAutoFixes.aliasesPadded;

  // Report
  writeReport(allResults, stats);

  // Console summary
  const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
  console.log("");
  console.log("================ LANGUAGE QUALITY PASS — SUMMARY ================");
  console.log(`Files audited:        ${stats.filesAudited}`);
  console.log(`Files modified:       ${stats.filesModified}`);
  console.log(`Files skipped:        ${stats.filesSkipped}`);
  console.log(`Items audited:        ${stats.itemsAudited}`);
  console.log(`Total auto-fixes:     ${stats.totalAutoFixesAll}`);
  console.log(`  spelling:           ${stats.totalAutoFixes.spelling}`);
  console.log(`  contractions:       ${stats.totalAutoFixes.contractions}`);
  console.log(`  doubleSpaces:       ${stats.totalAutoFixes.doubleSpaces}`);
  console.log(`  trim:               ${stats.totalAutoFixes.trim}`);
  console.log(`  trailingPeriod:     ${stats.totalAutoFixes.trailingPeriod}`);
  console.log(`  aliasesPadded:      ${stats.totalAutoFixes.aliasesPadded}`);
  const totalFlags = Object.values(stats.flagCountsByKind).reduce((a, b) => a + b, 0);
  console.log(`Flags for review:     ${totalFlags}`);
  console.log("");
  console.log("Top flag categories:");
  const sorted = Object.entries(stats.flagCountsByKind).sort((a, b) => b[1] - a[1]).slice(0, 10);
  for (const [k, v] of sorted) console.log(`  ${k.padEnd(38)} ${v}`);
  console.log("");
  console.log(`Report: ${REPORT_PATH.replace(root + "/", "")}`);
  console.log(`Elapsed: ${elapsedSec}s`);
}

main();
