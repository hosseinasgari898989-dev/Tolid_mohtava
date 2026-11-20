export const CONTENT_TOPICS = Object.freeze(["space", "body", "animals", "history", "nature", "numbers"]);
export const CONTENT_LAYOUTS = Object.freeze(["headline", "bignumber", "chart", "timeline", "comparison", "card", "list"]);
const ICONS = new Set(["brain", "low-battery", "clock", "lightbulb", "checklist", "question", "heart", "eye", "globe", "sparkles", "atom", "calendar", "map", "search"]);
const VISUALS = new Set(["neural", "particles", "waves", "geometry"]);
const TRANSITIONS = new Set(["zoom", "slide", "glitch", "wipe"]);
const isRecord = value => value !== null && typeof value === "object" && !Array.isArray(value);
const nonEmpty = value => typeof value === "string" && value.trim().length > 0;

export function normalizedTokens(text) {
  return String(text ?? "")
    .normalize("NFKC")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/ـ/g, "")
    .replace(/[\u064B-\u065F\u0670]/g, "")
    .match(/[\p{L}\p{N}]+/gu) || [];
}

export function effectiveTopic(item) {
  // V1 entries predate topics. Brain/memory editorial items are grouped under body.
  return item.topic ?? "body";
}
export function effectiveLayout(item) {
  return item.layout ?? item.scenes?.[0]?.layout ?? "headline";
}
export function effectiveData(item) {
  return item.data ?? item.scenes?.[0]?.data ?? {};
}
export function isUnverifiedSource(value) {
  if (Array.isArray(value)) return value.length === 1 && String(value[0]).trim().toUpperCase() === "TO_VERIFY";
  return String(value ?? "").trim().toUpperCase() === "TO_VERIFY";
}

export function validateContentBank(bank, label = "content bank") {
  if (!Array.isArray(bank)) throw new Error(label + " must be a JSON array.");
  const seen = new Set();
  const errors = [];
  for (const [index, item] of bank.entries()) {
    const where = label + " item " + (index + 1);
    if (!isRecord(item)) {
      errors.push(where + " must be an object.");
      continue;
    }
    if (!nonEmpty(item.id)) errors.push(where + ": id is required.");
    else if (seen.has(item.id)) errors.push("Duplicate content id: " + item.id);
    else seen.add(item.id);

    if (!["draft", "pending", "done"].includes(item.status)) {
      errors.push(where + " (" + item.id + "): status must be draft, pending, or done.");
    }
    const topic = effectiveTopic(item);
    if (!CONTENT_TOPICS.includes(topic)) errors.push(where + " (" + item.id + "): invalid topic '" + topic + "'.");
    const layout = effectiveLayout(item);
    if (!CONTENT_LAYOUTS.includes(layout)) errors.push(where + " (" + item.id + "): invalid layout '" + layout + "'.");
    if (!isRecord(effectiveData(item))) errors.push(where + " (" + item.id + "): data must be an object.");

    if (!nonEmpty(item.voiceover)) errors.push(where + " (" + item.id + "): voiceover is required.");
    if (!nonEmpty(item.caption)) errors.push(where + " (" + item.id + "): caption is required.");
    if (item.fact_source === undefined || item.fact_source === null ||
        (typeof item.fact_source === "string" && !item.fact_source.trim()) ||
        (Array.isArray(item.fact_source) && (
          item.fact_source.length === 0 || item.fact_source.some(source => !nonEmpty(source))
        ))) {
      errors.push(where + " (" + item.id + "): fact_source is required and cannot be empty.");
    }
    if (item.status === "pending" && isUnverifiedSource(item.fact_source)) {
      errors.push(where + " (" + item.id + "): fact_source=TO_VERIFY is not allowed while status=pending; keep this item draft.");
    }

    const provider = item.tts_provider ?? "edge";
    const voice = item.voice ?? "fa-IR-DilaraNeural";
    const rate = item.rate ?? "+6%";
    const pitch = item.pitch ?? "+0Hz";
    if (provider !== "edge") errors.push(where + " (" + item.id + "): only tts_provider=edge is enabled.");
    if (typeof voice !== "string" || !/^fa-IR-[A-Za-z]+Neural$/.test(voice)) {
      errors.push(where + " (" + item.id + "): voice must be a Persian Edge Neural voice.");
    }
    if (typeof rate !== "string" || !/^[+-]\d+%$/.test(rate)) {
      errors.push(where + " (" + item.id + "): rate must use a value such as +6%.");
    }
    if (typeof pitch !== "string" || !/^[+-]\d+Hz$/.test(pitch)) {
      errors.push(where + " (" + item.id + "): pitch must use a value such as +0Hz.");
    }

    if (!Array.isArray(item.hashtags)) {
      errors.push(where + " (" + item.id + "): hashtags must be an array.");
    } else {
      if (item.hashtags.length > 5) errors.push(where + " (" + item.id + "): hashtags maximum is 5.");
      if (item.hashtags.some(tag => !nonEmpty(tag))) errors.push(where + " (" + item.id + "): every hashtag must be non-empty.");
    }

    if (!Array.isArray(item.scenes) || item.scenes.length === 0) {
      errors.push(where + " (" + item.id + "): scenes must be a non-empty array.");
      continue;
    }

    let previousVisual = null;
    const narrationTokens = [];
    for (const [sceneIndex, scene] of item.scenes.entries()) {
      const sceneWhere = where + " (" + item.id + ") scene " + (sceneIndex + 1);
      if (!isRecord(scene)) {
        errors.push(sceneWhere + " must be an object.");
        continue;
      }
      for (const field of ["narration", "text_on_screen"]) {
        if (!nonEmpty(scene[field])) errors.push(sceneWhere + ": " + field + " is required.");
      }
      if (typeof scene.narration === "string") narrationTokens.push(...normalizedTokens(scene.narration));

      if (scene.highlight === undefined || typeof scene.highlight !== "string") {
        errors.push(sceneWhere + ": highlight must be a string (use an empty string when unused).");
      } else if (scene.highlight.trim()) {
        const highlightToken = normalizedTokens(scene.highlight)[0];
        if (!highlightToken || !normalizedTokens(scene.text_on_screen).includes(highlightToken)) {
          errors.push(sceneWhere + ": highlight must be a word contained in text_on_screen.");
        }
      }
      if (scene.icon === undefined || typeof scene.icon !== "string") {
        errors.push(sceneWhere + ": icon must be a string (use an empty string when unused).");
      } else if (scene.icon && !ICONS.has(scene.icon)) {
        errors.push(sceneWhere + ": unsupported icon '" + scene.icon + "'.");
      }
      if (!CONTENT_LAYOUTS.includes(scene.layout)) errors.push(sceneWhere + ": invalid layout.");
      if (!isRecord(scene.data)) errors.push(sceneWhere + ": data must be an object.");

      if (scene.visual !== undefined && !VISUALS.has(scene.visual)) errors.push(sceneWhere + ": invalid visual style.");
      if (scene.visual && previousVisual === scene.visual) errors.push(sceneWhere + ": background style must change every scene.");
      if (scene.visual) previousVisual = scene.visual;
      if (scene.transition !== undefined && !TRANSITIONS.has(scene.transition)) errors.push(sceneWhere + ": invalid transition.");
    }

    const voiceTokens = normalizedTokens(item.voiceover);
    if (narrationTokens.length !== voiceTokens.length ||
        narrationTokens.some((token, tokenIndex) => token !== voiceTokens[tokenIndex])) {
      errors.push(where + " (" + item.id + "): scene narration must cover the voiceover exactly, in order, with no missing or extra words.");
    }
  }

  if (errors.length) {
    throw new Error("Content bank validation failed:\n- " + errors.join("\n- "));
  }
  return { count: bank.length, ids: [...seen] };
}

export function validateSubtitleTimings(scenes, audioDuration) {
  const errors = [];
  if (!Array.isArray(scenes) || !Number.isFinite(audioDuration) || audioDuration <= 0) {
    return ["Subtitle QA needs scenes and a positive audio duration."];
  }
  let previousStart = -Infinity;
  let previousEnd = -Infinity;
  let wordCount = 0;
  for (const [sceneIndex, scene] of scenes.entries()) {
    if (!Array.isArray(scene.subtitleWords) || scene.subtitleWords.length === 0) {
      errors.push("Scene " + (sceneIndex + 1) + " has no word-level subtitle timings.");
      continue;
    }
    for (const [wordIndex, word] of scene.subtitleWords.entries()) {
      const start = Number(word.startSeconds);
      const end = Number(word.endSeconds);
      if (!Number.isFinite(start) || !Number.isFinite(end) || start < 0 || end <= start) {
        errors.push("Scene " + (sceneIndex + 1) + ", word " + (wordIndex + 1) + " has invalid timing.");
        continue;
      }
      if (start + 1e-6 < previousStart || start + 1e-6 < previousEnd) {
        errors.push("Subtitle timing is not monotonic at scene " + (sceneIndex + 1) + ", word " + (wordIndex + 1) + ".");
      }
      if (end > audioDuration + 0.001) {
        errors.push("Subtitle timing exceeds audio duration at scene " + (sceneIndex + 1) + ", word " + (wordIndex + 1) + ".");
      }
      previousStart = start;
      previousEnd = end;
      wordCount += 1;
    }
  }
  if (!wordCount) errors.push("No word-level subtitle timings were validated.");
  return errors;
}
