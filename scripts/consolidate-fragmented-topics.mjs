#!/usr/bin/env node
// Consolidate fragmented per-question topic labels in 8 practice exams so the
// per-topic mastery breakdown shows 4-12 meaningful units instead of 1Q per topic.
//
// The QUESTIONS array shape stays identical. Only the .topic field is
// rewritten to roll up to unit-level labels matching the gold-standard
// pattern (~3-8 Q per topic).
//
// Run:   node scripts/consolidate-fragmented-topics.mjs
// Check: node scripts/consolidate-fragmented-topics.mjs --check

import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const WRITE = !process.argv.includes("--check");

// Per-course topic-consolidation mapping. Each entry is:
// {
//   file: relative path,
//   maps: [
//     // [matcherRegex, replacement, optional NEW topic prefix]
//     [/Polynomials:.*/, "Unit 1: Polynomial Functions"],
//     ...
//   ]
// }
const CONSOLIDATIONS = [
  // -------------- regents-algebra-2 --------------
  // NYS Algebra II Regents has 6 official content modules:
  //   M1 Polynomial+Rational+Radical Relationships
  //   M2 Trigonometric Functions
  //   M3 Exponential+Logarithmic Functions
  //   M4 Inferences+Conclusions from Data (Statistics)
  //   Modeling (cross-module)
  {
    file: "games/regents-algebra-2/practice-exam.html",
    maps: [
      [/^Polynomials:.*/, "Module 1: Polynomial + Rational + Radical Relationships"],
      [/^Rational (Expressions|Equations):.*/, "Module 1: Polynomial + Rational + Radical Relationships"],
      [/^Radical (Equations|Functions).*/, "Module 1: Polynomial + Rational + Radical Relationships"],
      [/^Rational Exponents:.*/, "Module 1: Polynomial + Rational + Radical Relationships"],
      [/^Trig:.*/, "Module 2: Trigonometric Functions"],
      [/^Exponential (Functions|Equations|Modeling):.*/, "Module 3: Exponential + Logarithmic Functions"],
      [/^Logarithm.*/, "Module 3: Exponential + Logarithmic Functions"],
      [/^Compound Interest.*/, "Module 3: Exponential + Logarithmic Functions"],
      [/^Sequences:.*/, "Module 3: Exponential + Logarithmic Functions"],
      [/^Series:.*/, "Module 3: Exponential + Logarithmic Functions"],
      [/^Probability:.*/, "Module 4: Inferences + Conclusions from Data"],
      [/^Statistics:.*/, "Module 4: Inferences + Conclusions from Data"],
      [/^Modeling:.*/, "Cross-Module: Modeling + Function Families"],
    ],
  },

  // -------------- regents-geometry --------------
  // NYS Geometry Regents has 5 official modules:
  //   M1 Congruence, Proof, Constructions
  //   M2 Similarity, Proof, Trigonometry
  //   M3 Extending to Three Dimensions
  //   M4 Connecting Algebra+Geometry through Coordinates
  //   M5 Circles With and Without Coordinates
  {
    file: "games/regents-geometry/practice-exam.html",
    maps: [
      [/^Transformations:.*/, "Module 1: Congruence, Proof, + Constructions"],
      [/^Congruence:.*/, "Module 1: Congruence, Proof, + Constructions"],
      [/^Constructions:.*/, "Module 1: Congruence, Proof, + Constructions"],
      [/^Similarity:.*/, "Module 2: Similarity, Proof, + Trigonometry"],
      [/^Right Triangles:.*/, "Module 2: Similarity, Proof, + Trigonometry"],
      [/^Measurement:.*/, "Module 3: Extending to Three Dimensions"],
      [/^Coordinate Geometry:.*/, "Module 4: Connecting Algebra + Geometry through Coordinates"],
      [/^Circles:.*/, "Module 5: Circles With and Without Coordinates"],
      [/^Modeling:.*/, "Cross-Module: Modeling + Real-World Application"],
    ],
  },

  // -------------- ap-eng-lit-practice --------------
  // 45 questions across 5 passages = 9 Q per passage.
  // Labels in source: Prose Passage 1 (P&P), Poetry Passage 1 (Flea),
  // Prose Passage 2 (HuckFinn), Poetry Passage 2 (Grecian Urn),
  // Prose Passage 3 (Original Lighthouse).
  // NOTE: replacements wrap titles in single-typographic quotes so we don't
  // collide with the surrounding double-quoted JS string literal.
  {
    file: "games/ap-eng-lit-practice/practice-exam.html",
    maps: [
      [/^Prose Passage 1.*/, "Passage 1: Pride and Prejudice (Austen, 1813)"],
      [/^Poetry Passage 1.*/, "Passage 2: ‘The Flea’ (Donne, 1633)"],
      [/^Prose Passage 2.*/, "Passage 3: Huckleberry Finn (Twain, 1884)"],
      [/^Poetry Passage 2.*/, "Passage 4: ‘Ode on a Grecian Urn’ (Keats, 1819)"],
      [/^Prose Passage 3.*/, "Passage 5: Original lighthouse passage"],
    ],
  },

  // -------------- ap-eng-lang-practice --------------
  // AP English Language and Composition rolls up to three clusters:
  //   Reading: Rhetorical Analysis (claim/purpose, audience, evidence, style)
  //   Writing: Argument + Synthesis (claim, evidence, organization)
  //   Writing: Sentence Mechanics + Conventions
  {
    file: "games/ap-eng-lang-practice/practice-exam.html",
    maps: [
      [/^Reading: Main Claim.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Argument.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Intent.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Purpose.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Thesis.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Audience.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Speaker.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Context.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Rhetorical.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Evidence.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Counterargument.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Rebuttal.*/, "Reading: Rhetorical Analysis"],
      [/^Reading: Tone.*/, "Reading: Style + Diction"],
      [/^Reading: Diction.*/, "Reading: Style + Diction"],
      [/^Reading: Word Choice.*/, "Reading: Style + Diction"],
      [/^Reading: Syntax.*/, "Reading: Style + Diction"],
      [/^Reading: Figurative.*/, "Reading: Style + Diction"],
      [/^Reading: Imagery.*/, "Reading: Style + Diction"],
      [/^Writing: Thesis.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Claim.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Logical.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Evidence.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Synthesis.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Commentary.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Organization.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Paragraph.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Transitions.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Conclusion.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Sources.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Citation.*/, "Writing: Argument + Synthesis"],
      [/^Writing: Tone.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Style.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Sentence.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Conciseness.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Concision.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Mechanics.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Grammar.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Punctuation.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Parallel.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Pronoun.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Subject.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Modifier.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Writing: Active.*/, "Writing: Sentence Mechanics + Conventions"],
      [/^Conventions.*/, "Writing: Sentence Mechanics + Conventions"],
    ],
  },

  // -------------- ap-calc-bc-practice --------------
  // AP Calc BC has 10 official units:
  //   U1 Limits + Continuity
  //   U2 Differentiation: Definition + Fundamental Properties
  //   U3 Differentiation: Composite, Implicit, + Inverse
  //   U4 Contextual Applications of Differentiation
  //   U5 Analytical Applications of Differentiation
  //   U6 Integration + Accumulation of Change
  //   U7 Differential Equations
  //   U8 Applications of Integration
  //   U9 Parametric, Polar, + Vector-Valued Functions
  //   U10 Infinite Sequences + Series
  {
    file: "games/ap-calc-bc-practice/practice-exam.html",
    maps: [
      [/^Limits.*|^Unit 1.*Limits.*|^Continuity.*/, "Unit 1: Limits + Continuity"],
      [/^Differentiation: Definition.*|^Differentiation: Power Rule.*|^Differentiation: Quotient.*|^Differentiation: Product.*|^Unit 2.*/, "Unit 2: Differentiation Definition + Fundamental Properties"],
      [/^Differentiation: Composite.*|^Differentiation: Chain.*|^Differentiation: Implicit.*|^Differentiation: Inverse.*|^Unit 3.*/, "Unit 3: Differentiation: Composite, Implicit, + Inverse"],
      [/^Contextual Applications.*|^Related Rates.*|^Linear Approximation.*|^Unit 4.*/, "Unit 4: Contextual Applications of Differentiation"],
      [/^Analytical Applications.*|^Extrema.*|^Concavity.*|^Curve Sketching.*|^Optimization.*|^Mean Value.*|^Unit 5.*/, "Unit 5: Analytical Applications of Differentiation"],
      [/^Integration.*|^Antiderivative.*|^Riemann.*|^Definite Integral.*|^Fundamental Theorem.*|^Unit 6.*/, "Unit 6: Integration + Accumulation of Change"],
      [/^Differential Equations.*|^Slope Field.*|^Euler.*|^Logistic.*|^Unit 7.*/, "Unit 7: Differential Equations"],
      [/^Applications of Integration.*|^Area Between Curves.*|^Volume.*|^Arc Length.*|^Unit 8.*/, "Unit 8: Applications of Integration"],
      [/^Parametric.*|^Polar.*|^Vector-Valued.*|^Vector Functions.*|^Unit 9.*/, "Unit 9: Parametric, Polar, + Vector-Valued Functions"],
      [/^Sequences.*|^Series.*|^Power Series.*|^Taylor.*|^Maclaurin.*|^Convergence.*|^Unit 10.*/, "Unit 10: Infinite Sequences + Series"],
    ],
  },

  // -------------- grade-5-ela-practice --------------
  // NYS Grade 5 ELA standards roll up to 4 CCSS strands.
  {
    file: "games/grade-5-ela-practice/practice-exam.html",
    maps: [
      [/^Reading Literature.*|^RL\..*|^Reading: Literature.*/, "Reading Literature (RL)"],
      [/^Reading Informational.*|^RI\..*|^Reading: Informational Text.*/, "Reading Informational Text (RI)"],
      [/^Language.*|^L\..*/, "Language Conventions + Vocabulary (L)"],
      [/^Writing.*|^W\..*/, "Writing + Synthesis (W)"],
      [/^Speaking.*|^SL\..*|^Listening.*/, "Language Conventions + Vocabulary (L)"],
      [/^Vocabulary.*/, "Language Conventions + Vocabulary (L)"],
      [/^Foundational.*|^RF\..*/, "Foundational Skills + Word Study"],
    ],
  },

  // -------------- grade-7-ela-practice --------------
  // Same approach as G5.
  {
    file: "games/grade-7-ela-practice/practice-exam.html",
    maps: [
      [/^Reading Literature.*|^RL\..*|^Reading: Literature.*/, "Reading Literature (RL)"],
      [/^Reading Informational.*|^RI\..*|^Reading: Informational Text.*/, "Reading Informational Text (RI)"],
      [/^Language.*|^L\..*/, "Language Conventions + Vocabulary (L)"],
      [/^Writing.*|^W\..*/, "Writing + Synthesis (W)"],
      [/^Speaking.*|^SL\..*|^Listening.*/, "Language Conventions + Vocabulary (L)"],
      [/^Vocabulary.*/, "Language Conventions + Vocabulary (L)"],
      [/^Foundational.*|^RF\..*/, "Foundational Skills + Word Study"],
    ],
  },

  // -------------- grade-8-ela-practice --------------
  {
    file: "games/grade-8-ela-practice/practice-exam.html",
    maps: [
      [/^Reading Literature.*|^RL\..*|^Reading: Literature.*/, "Reading Literature (RL)"],
      [/^Reading Informational.*|^RI\..*|^Reading: Informational Text.*/, "Reading Informational Text (RI)"],
      [/^Language.*|^L\..*/, "Language Conventions + Vocabulary (L)"],
      [/^Writing.*|^W\..*/, "Writing + Synthesis (W)"],
      [/^Speaking.*|^SL\..*|^Listening.*/, "Language Conventions + Vocabulary (L)"],
      [/^Vocabulary.*/, "Language Conventions + Vocabulary (L)"],
      [/^Foundational.*|^RF\..*/, "Foundational Skills + Word Study"],
    ],
  },
];

// ----------------------------------------------------------------------------

function consolidateFile(spec) {
  const path = resolve(spec.file);
  const src = readFileSync(path, "utf8");
  // We rewrite the topic: "..." lines. The pattern is:
  //   topic: "Some Specific Topic Name",
  // We match the topic value, run it through the maps, replace if matched.
  const TOPIC_LINE = /(\s+)topic:\s*"([^"]+)",/g;
  let modCount = 0;
  let touchedTopics = new Set();
  const newSrc = src.replace(TOPIC_LINE, (match, indent, topic) => {
    for (const [pattern, replacement] of spec.maps) {
      if (pattern.test(topic)) {
        modCount += 1;
        touchedTopics.add(topic + " → " + replacement);
        return `${indent}topic: "${replacement}",`;
      }
    }
    return match;
  });
  return { src, newSrc, modCount, touchedTopics: [...touchedTopics], path };
}

// ----------------------------------------------------------------------------

console.log("=".repeat(72));
console.log("PRACTICE EXAM TOPIC CONSOLIDATION");
console.log("=".repeat(72));
console.log(`Mode: ${WRITE ? "WRITE (auto-fixing)" : "CHECK (read-only)"}`);

let totalMods = 0;
const report = [];
for (const spec of CONSOLIDATIONS) {
  try {
    const { src, newSrc, modCount, touchedTopics, path } = consolidateFile(spec);
    console.log(`\n${spec.file}: ${modCount} topic-line rewrites`);
    for (const t of touchedTopics) console.log(`  ${t}`);
    if (modCount > 0 && newSrc !== src && WRITE) {
      writeFileSync(path, newSrc);
      console.log(`  → written`);
    }
    totalMods += modCount;
    report.push({ file: spec.file, modCount, touchedTopics });
  } catch (err) {
    console.error(`  FAILED: ${err.message}`);
  }
}

console.log(`\nTotal topic-line rewrites: ${totalMods}`);
console.log("DONE.");
