(function (root) {
  "use strict";

  var SOURCE_RE = /(\bthis\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter)\b|\bthese\s+(documents|maps|cartoons|graphs|charts|photographs|photos|sources|timelines|images|posters|newspapers|tables|statements|conditions|changes|figures)\b|\b(shown|pictured|illustrated|accompanying)\b|\b(above|below)\s+(document|source|passage|excerpt|map|cartoon|chart|graph|image|photograph|photo|poster|timeline|painting|newspaper|headline)\b|\bthe\s+(excerpt|passage|document|map|cartoon|graph|chart|photograph|photo|source|timeline|image|poster|newspaper|table|letter)\b|\baccording\s+to\s+(the|this)\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|author|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+this\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b|\bbased\s+on\s+the\s+(passage|excerpt|source|document|map|cartoon|chart|graph|image|photograph|photo|poster|article|letter|speech|timeline|newspaper|table)\b)/i;

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
    var ok = !needed || trustedSource(question);
    return {
      ok: ok,
      needed: needed,
      reason: reason,
      images: ok && needed ? images : [],
      identity: sourceIdentity(question),
      label: ok ? (needed ? "Source Lock: verified" : "Source Lock: not needed") : "Source Lock: blocked",
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
    var tooShort = directResponse && wordCount(prompt) < 8;
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

  function playableSharedPrompt(question) {
    return promptQuality(question).ok;
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
    playableSharedPrompt: playableSharedPrompt
  };
})(typeof window !== "undefined" ? window : globalThis);
