(function (root) {
  "use strict";

  var SOURCE_RE = /(\bthis\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter|statement|speech|article|quotation|quote|painting|stamp|headline)\b|\bthese\s+(documents|maps|cartoons|graphs|charts|photographs|photos|sources|timelines|images|posters|newspapers|tables|statements|conditions|changes|figures|speeches|articles|quotations|quotes|paintings|stamps|headlines)\b|\bboth\s+(documents|sources|passages|excerpts|statements|headlines|maps|cartoons|charts|graphs|images|photographs|photos)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline|statement|speech|article|quotation|quote|stamp)\b|\bthe\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter|statement|speech|article|quotation|quote|painting|stamp|headline)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table|statement|quotation|quote|painting|stamp|headline)\b|\binformation\s+(in|on|from)\s+(the|this)\s+(map|cartoon|chart|graph|table|document|source|image|photograph|photo|poster|article|speech|statement|quotation|quote|newspaper|headline|timeline|painting|stamp)\b)/i;

  function cleanList(value) {
    return Array.isArray(value) ? value : [];
  }

  function textFor(question) {
    question = question || {};
    return [question.stem, question.prompt, question.stimulusText].join(" ");
  }

  function answerText(question) {
    question = question || {};
    if (question.answer) return String(question.answer);
    var correct = cleanList(question.choices).find(function (choice) {
      return String(choice && choice.label) === String(question.correct);
    });
    return correct && correct.text ? String(correct.text) : "";
  }

  function wordCount(value) {
    return String(value || "").trim().split(/\s+/).filter(Boolean).length;
  }

  function cleanText(value) {
    return String(value || "")
      .replace(/\s+/g, " ")
      .replace(/\s+([,.;:!?])/g, "$1")
      .trim();
  }

  function sentenceCase(value) {
    var text = cleanText(value);
    if (!text) return "";
    text = text.replace(/^([a-z])/, function (_, letter) { return letter.toUpperCase(); });
    return text;
  }

  var GENERIC_CONTEXT_RE = /\b(big picture|core concepts?|events?\s*\+\s*laws|people\s*\+\s*places|institutions?|rights?\s*\+\s*cases|policy\s*\+\s*power|participation|applications|variables|therapies|principles?|conflict\s*\+\s*change|modern connections|power\s*\+\s*government|scarcity\s*\+\s*choices|questions?|review|final wager)\b/i;

  function escapeRegExp(value) {
    return String(value || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }

  function stimulusImages(question) {
    question = question || {};
    var images = cleanList(question.stimulusImages).filter(function (image) {
      return image && image.src;
    });
    if (!images.length && question.stimulusImage) {
      images = [{ src: question.stimulusImage, label: "Source stimulus" }];
    }
    return images;
  }

  function hasStimulusImages(question) {
    return stimulusImages(question).length > 0;
  }

  function isQuarantined(question) {
    return /^quarantined/i.test(String((question && question.sourceIntegrity) || ""));
  }

  function sourceBased(question) {
    question = question || {};
    return hasStimulusImages(question) || question.stimulusRequired === true || SOURCE_RE.test(textFor(question));
  }

  function courseMatchesStimulus(question) {
    question = question || {};
    var srcs = stimulusImages(question).map(function (image) {
      return String(image.src || "");
    });
    if (!srcs.length) return false;
    var course = String(question.course || "");
    if (/U\.S\. History/i.test(course)) {
      return srcs.every(function (src) {
        return /\/us-day/i.test(src) || /regents-released-forms\/us-/i.test(src);
      });
    }
    if (/Global History/i.test(course)) {
      return srcs.every(function (src) {
        return /\/global-day/i.test(src) || /regents-released-forms\/global-/i.test(src);
      });
    }
    return true;
  }

  function hasTrustedFlag(question) {
    var integrity = String((question && question.sourceIntegrity) || "");
    if (!integrity && sourceBased(question)) return false;
    if (!integrity) return true;
    return /trusted|official|verified/i.test(integrity);
  }

  function trustedSource(question) {
    return Boolean(
      question &&
      !isQuarantined(question) &&
      hasStimulusImages(question) &&
      courseMatchesStimulus(question) &&
      hasTrustedFlag(question)
    );
  }

  function usableRegentsQuestion(question) {
    if (!question || isQuarantined(question)) return false;
    if (!sourceBased(question)) return true;
    return trustedSource(question);
  }

  function missingSourceReason(question) {
    if (!question) return "Missing question record";
    if (isQuarantined(question)) return "Source was quarantined for review";
    if (!sourceBased(question)) return "";
    if (!hasStimulusImages(question)) return "Question needs a source image";
    if (!courseMatchesStimulus(question)) return "Stimulus path does not match the selected course";
    if (!hasTrustedFlag(question)) return "Source has not been marked trusted";
    return "";
  }

  function sourceIdentity(question) {
    question = question || {};
    var source = question.source || question.set || question.day || "";
    var match = String(source).match(/\bQ(?:uestion)?\.?\s*#?\s*(\d+[A-Za-z]?)/i);
    var official = match ? "Q" + match[1] : (question.officialQuestionNumber || "");
    return [
      question.course || "",
      source,
      official,
      stimulusImages(question).map(function (image) { return image.src; }).sort().join("|")
    ].join("::");
  }

  function sourceLock(question) {
    var images = stimulusImages(question);
    var needed = sourceBased(question);
    var reason = missingSourceReason(question);
    var ok = !isQuarantined(question) && (!needed || trustedSource(question));
    return {
      ok: ok,
      needed: needed,
      reason: reason,
      images: ok && needed ? images : [],
      identity: sourceIdentity(question),
      label: ok ? (needed ? "Source matched" : "No source needed") : "Source blocked",
      source: question && (question.source || question.set || question.day || "")
    };
  }

  function sourceLockLabel(question) {
    return sourceLock(question).label;
  }

  function promptQuality(question) {
    question = question || {};
    var prompt = String(question.prompt || question.stem || "").trim();
    var answer = String(answerText(question) || "").trim();
    var directResponse = !cleanList(question.choices).length && !!answer;
    var jeopardyStyle = /^jeopardy/i.test(String(question.type || "")) || /jeopardy/i.test(String(question.source || ""));
    var tooShort = directResponse && wordCount(prompt) < (jeopardyStyle ? 3 : 8);
    var synthesis = /use one specific example to explain why it matters/i.test(prompt);
    var weakLead = /^this\s+(explains|is|was|describes|refers to)\b/i.test(prompt);
    var answerLeak = false;
    if (directResponse && prompt && answer && answer.length >= 4) {
      answerLeak = new RegExp("\\b" + escapeRegExp(answer) + "\\b", "i").test(prompt);
    }
    var ok = Boolean(prompt) && (!directResponse || (!tooShort && !synthesis && !weakLead && !answerLeak));
    return {
      ok: ok,
      prompt: prompt,
      answer: answer,
      directResponse: directResponse,
      jeopardyStyle: jeopardyStyle,
      tooShort: tooShort,
      synthesis: synthesis,
      weakLead: weakLead,
      answerLeak: answerLeak,
      reason: !prompt ? "missing prompt" :
        tooShort ? "prompt is too short for standalone play" :
        synthesis ? "prompt expects extended explanation, not a single answer" :
        weakLead ? "prompt lead-in is too vague" :
        answerLeak ? "prompt leaks the answer" : ""
    };
  }

  function stripEssayTail(value) {
    return cleanText(value).replace(/\s*Use one specific example to explain why it matters for[\s\S]*$/i, "");
  }

  function isGenericContext(value) {
    return GENERIC_CONTEXT_RE.test(cleanText(value));
  }

  function isShortCategoryPrefix(value) {
    var text = cleanText(value);
    if (!text) return false;
    var words = text.split(/\s+/).filter(Boolean);
    if (!words.length || words.length > 4) return false;
    return words.every(function (word) {
      return /^[A-Z0-9][A-Za-z0-9&.'/-]*$/.test(word);
    });
  }

  function promptSource(question) {
    question = question || {};
    return cleanText(question.prompt || question.stem || "");
  }

  function displayPrompt(question) {
    question = question || {};
    var text = stripEssayTail(promptSource(question));
    if (!text) return "";
    var loops = 0;
    while (loops < 4) {
      var next = text
        .replace(/^final\s+clue(?:\s+for\s+[^:]+)?:\s*/i, "")
        .replace(/^name\s+this\s+content\s+item:\s*/i, "")
        .replace(/^this\s+is\s+his\s+/i, "Identify the person whose ")
        .replace(/^this\s+is\s+her\s+/i, "Identify the person whose ")
        .replace(/^this\s+is\s+/i, "Identify: ")
        .replace(/^these\s+are\s+/i, "Identify: ")
        .replace(/^(.{1,90}?)\s+term\s+for\s+(.{1,90}?)\s+term\s+for\s+(.+)$/i, function (_, outer, inner, body) {
          return isGenericContext(inner) ? (isGenericContext(outer) ? body : cleanText(outer) + ": " + body) : _;
        })
        .replace(/^(.{1,90}?)\s+term\s+for\s+(.{1,60}?)\s+term\s+for\s+\2\s+term\s+for\s+(.+)$/i, function (_, outer, inner, body) {
          return cleanText(outer) + ": " + body;
        })
        .replace(/^(.{1,90}?)\s*:\s*(.{1,90}?)\s+term\s+for\s+(.+)$/i, function (_, outer, inner, body) {
          return isGenericContext(inner) ? cleanText(outer) + ": " + body : _;
        })
        .replace(/^(.{1,90}?)\s+term\s+for\s+(.+)$/i, function (_, outer, body) {
          return isGenericContext(outer) ? body : _;
        });
      if (next === text) break;
      text = cleanText(next);
      loops += 1;
    }
    var setText = cleanText(question.set || question.day || "");
    if (setText) {
      text = text.replace(new RegExp("^" + escapeRegExp(setText) + "\\s+term\\s+for\\s+", "i"), "");
    }
    text = text.replace(/^(.{1,90}?)\s+term\s+for\s+(.+)$/i, function (_, outer, body) {
      return wordCount(outer) <= 3 && !sourceBased(question) ? body : _;
    });
    text = text.replace(/^(.{1,90}?)\s+term\s+for\s+(.+)$/i, function (_, outer, body) {
      return !sourceBased(question) && isShortCategoryPrefix(outer) ? body : _;
    });
    return sentenceCase(text);
  }

  function displaySource(question) {
    question = question || {};
    var source = cleanText(question.source || "");
    if (!source || /jeopardy review/i.test(source)) {
      var category = cleanText(question.category || "");
      if (category && !isGenericContext(category)) return category;
      return "";
    }
    return source;
  }

  function displayStimulusLabel(question, image) {
    image = image || {};
    var label = cleanText(image.label || "");
    if (!label || /^(source|visual)\s+stimulus\b/i.test(label)) return displaySource(question) || "Source";
    return label;
  }

  function playableSharedPrompt(question) {
    return promptQuality(question).ok;
  }

  // ---- Curated bank: indexable lookup / tag / course helpers ---------------
  //
  // The arcade ships question banks via JSON (regents-gauntlet-bank.json,
  // chrono-defense-bank.json, etc.). Some games want a stable handle: a unique
  // ID per source, a tag list, and an alt-text-aware image. The helpers below
  // build a normalized view over any array of question records and let games
  // call lookup(id) / searchByTag(tag) / getAllForCourse(course).

  var bankIndex = null;
  var bankRecords = [];
  var bankRegistered = false;

  function stableId(record, fallbackIndex) {
    if (!record) return "src-" + (fallbackIndex || 0);
    if (record.id) return String(record.id);
    if (record.officialQuestionNumber && record.course) {
      return slugify(record.course) + ":" + slugify(record.officialQuestionNumber);
    }
    var src = stimulusImages(record).map(function (image) { return image.src; }).join("|");
    if (src) return "img:" + slugify(src.slice(0, 80));
    var prompt = String(record.prompt || record.stem || "").slice(0, 80);
    if (prompt) return "p:" + slugify(prompt);
    return "src-" + (fallbackIndex || 0);
  }

  function slugify(value) {
    return String(value || "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 100) || "unknown";
  }

  function recordTags(record) {
    record = record || {};
    var raw = [];
    if (Array.isArray(record.tags)) raw = raw.concat(record.tags);
    if (record.skill) raw.push(record.skill);
    if (record.topic) raw.push(record.topic);
    if (record.set) raw.push(record.set);
    if (record.day) raw.push(record.day);
    if (record.subject) raw.push(record.subject);
    if (sourceBased(record)) raw.push("source-based");
    if (hasStimulusImages(record)) raw.push("has-image");
    var seen = Object.create(null);
    var out = [];
    raw.forEach(function (tag) {
      if (tag == null) return;
      var s = slugify(tag);
      if (!s || seen[s]) return;
      seen[s] = true;
      out.push(s);
    });
    return out;
  }

  function recordImages(record) {
    return stimulusImages(record).map(function (image, idx) {
      return {
        src: image.src,
        alt: String(image.alt || image.label || displayStimulusLabel(record, image) || ("Source image " + (idx + 1))),
        label: image.label || ""
      };
    });
  }

  function indexRecord(record, fallbackIndex) {
    var id = stableId(record, fallbackIndex);
    return {
      id: id,
      record: record,
      course: String(record && record.course || ""),
      tags: recordTags(record),
      images: recordImages(record),
      sourceBased: sourceBased(record),
      trusted: trustedSource(record),
      label: displaySource(record) || displayPrompt(record) || id
    };
  }

  function buildIndex(records) {
    var arr = Array.isArray(records) ? records : [];
    var byId = Object.create(null);
    var byTag = Object.create(null);
    var byCourse = Object.create(null);
    var entries = arr.map(function (record, i) {
      var entry = indexRecord(record, i);
      // ensure id uniqueness
      var base = entry.id;
      var n = 1;
      while (byId[entry.id]) {
        n += 1;
        entry.id = base + "-" + n;
      }
      byId[entry.id] = entry;
      entry.tags.forEach(function (tag) {
        (byTag[tag] = byTag[tag] || []).push(entry);
      });
      var courseKey = slugify(entry.course || "uncategorized");
      (byCourse[courseKey] = byCourse[courseKey] || []).push(entry);
      return entry;
    });
    return { entries: entries, byId: byId, byTag: byTag, byCourse: byCourse };
  }

  function ensureIndex() {
    if (bankIndex) return bankIndex;
    bankIndex = buildIndex(bankRecords);
    return bankIndex;
  }

  function registerRecords(records) {
    bankRecords = Array.isArray(records) ? records.slice() : [];
    bankIndex = null;
    bankRegistered = true;
    return ensureIndex();
  }

  function lookup(id) {
    if (id == null) return null;
    var idx = ensureIndex();
    return idx.byId[String(id)] || null;
  }

  function searchByTag(tag) {
    if (!tag) return [];
    var idx = ensureIndex();
    var key = slugify(tag);
    return (idx.byTag[key] || []).slice();
  }

  function getAllForCourse(course) {
    var idx = ensureIndex();
    if (!course) return idx.entries.slice();
    var key = slugify(course);
    var direct = idx.byCourse[key];
    if (direct && direct.length) return direct.slice();
    // fallback: substring match on course label
    var needle = slugify(course);
    return idx.entries.filter(function (entry) {
      return slugify(entry.course).indexOf(needle) !== -1;
    });
  }

  function bankSize() {
    return ensureIndex().entries.length;
  }

  function isRegistered() {
    return bankRegistered;
  }

  root.MrMacsSourceBank = {
    sourcePattern: SOURCE_RE,
    stimulusImages: stimulusImages,
    hasStimulusImages: hasStimulusImages,
    isQuarantined: isQuarantined,
    sourceBased: sourceBased,
    courseMatchesStimulus: courseMatchesStimulus,
    trustedSource: trustedSource,
    verifiedSourceQuestion: trustedSource,
    usableRegentsQuestion: usableRegentsQuestion,
    missingSourceReason: missingSourceReason,
    sourceIdentity: sourceIdentity,
    sourceLock: sourceLock,
    sourceLockLabel: sourceLockLabel,
    answerText: answerText,
    promptQuality: promptQuality,
    playableSharedPrompt: playableSharedPrompt,
    displayPrompt: displayPrompt,
    displaySource: displaySource,
    displayStimulusLabel: displayStimulusLabel,
    // Curated bank registry (additive — games may opt in)
    registerRecords: registerRecords,
    lookup: lookup,
    searchByTag: searchByTag,
    getAllForCourse: getAllForCourse,
    bankSize: bankSize,
    isRegistered: isRegistered,
    stableId: stableId,
    recordTags: recordTags
  };
})(typeof window !== "undefined" ? window : globalThis);
