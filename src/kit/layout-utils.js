import { PERSIAN_DIGITS } from "../../design/tokens.js";

const PERSIAN_SCRIPT = /[\u0600-\u06FF]/u;
export const VIDEO_LAYOUTS = Object.freeze(["headline", "bignumber", "chart", "timeline", "comparison", "card", "list"]);
export const toPersianDigits = value => String(value).replace(/[0-9]/g, digit => PERSIAN_DIGITS[Number(digit)]);
export const normalizePersianText = value => String(value ?? "").normalize("NFKC").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/\u0640/g, "").trim();

const glyphWidth = character => {
  if (/\s/u.test(character)) return 0.28;
  if (/[0-9۰-۹]/u.test(character)) return 0.58;
  if (/[A-Za-z]/u.test(character)) return 0.56;
  if (PERSIAN_SCRIPT.test(character)) return 0.57;
  return 0.62;
};
export const estimateLineWidth = text => Array.from(String(text)).reduce((sum, character) => sum + glyphWidth(character), 0);

function wrapMetrics(text, fontSize, width) {
  const words = normalizePersianText(text).split(/\s+/u).filter(Boolean);
  if (!words.length) return { lineCount: 0, longestLine: 0, widestWord: 0 };
  let line = "";
  let longestLine = 0;
  let widestWord = 0;
  let lineCount = 1;
  for (const word of words) {
    const wordWidth = estimateLineWidth(word);
    widestWord = Math.max(widestWord, wordWidth);
    const candidate = line ? line + " " + word : word;
    if (line && estimateLineWidth(candidate) * fontSize > width) {
      longestLine = Math.max(longestLine, estimateLineWidth(line));
      line = word;
      lineCount += 1;
    } else {
      line = candidate;
    }
  }
  longestLine = Math.max(longestLine, estimateLineWidth(line));
  return { lineCount, longestLine, widestWord };
}

export function measureTextFit(text, {
  width = 860, fontSize = 76, minFontSize = 32, maxLines = 3
} = {}) {
  const metrics = wrapMetrics(text, fontSize, width);
  if (!metrics.lineCount) {
    return { fontSize: minFontSize, requestedFontSize: fontSize, minFontSize, lineCount: 0, overflow: false, requiresBelowMinimum: false };
  }
  const widthScale = Math.min(1, width / Math.max(1, metrics.longestLine * fontSize));
  const lineScale = Math.min(1, maxLines / metrics.lineCount);
  const computed = Math.floor(fontSize * Math.min(widthScale, lineScale));
  const minimumMetrics = wrapMetrics(text, minFontSize, width);
  const overflow = minimumMetrics.lineCount > maxLines || minimumMetrics.widestWord * minFontSize > width;
  const requiresBelowMinimum = computed < minFontSize || overflow;
  return {
    fontSize: Math.max(minFontSize, Math.min(fontSize, computed)),
    requestedFontSize: fontSize,
    minFontSize,
    lineCount: metrics.lineCount,
    minLineCount: minimumMetrics.lineCount,
    longestLine: metrics.longestLine,
    overflow,
    requiresBelowMinimum
  };
}

export const fitFontSize = (text, options = {}) => measureTextFit(text, options).fontSize;
export const fitTextStyle = (text, options = {}) => ({
  fontSize: fitFontSize(text, options),
  lineHeight: 1.25,
  maxWidth: options.width ?? 860,
  direction: "rtl",
  textAlign: "center",
  overflowWrap: "anywhere",
  wordBreak: "normal"
});
export const isValidLayout = layout => VIDEO_LAYOUTS.includes(layout);

export const KEY_CONTENT_SAFE_AREA = Object.freeze({ top: 12, bottom: 72 });
export const KEY_CONTENT_AREA = Object.freeze({ top: 31, bottom: 72, height: 41 });

export function isKeyContentAreaSafe() {
  return KEY_CONTENT_AREA.top >= KEY_CONTENT_SAFE_AREA.top &&
    KEY_CONTENT_AREA.bottom <= KEY_CONTENT_SAFE_AREA.bottom &&
    KEY_CONTENT_AREA.height === KEY_CONTENT_AREA.bottom - KEY_CONTENT_AREA.top;
}

export const TEXT_ROLE_LIMITS = Object.freeze({
  headline: { width: 900, fontSize: 108, minFontSize: 90, maxLines: 3 },
  cardTitle: { width: 650, fontSize: 56, minFontSize: 48, maxLines: 2 },
  cardBody: { width: 750, fontSize: 42, minFontSize: 38, maxLines: 4 },
  chartTitle: { width: 880, fontSize: 52, minFontSize: 48, maxLines: 2 },
  comparisonLabel: { width: 390, fontSize: 48, minFontSize: 48, maxLines: 2 },
  comparisonDetail: { width: 390, fontSize: 38, minFontSize: 38, maxLines: 3 },
  chartLabel: { width: 390, fontSize: 36, minFontSize: 32, maxLines: 2 },
  timelineTitle: { width: 820, fontSize: 54, minFontSize: 48, maxLines: 2 },
  timelineBody: { width: 820, fontSize: 42, minFontSize: 38, maxLines: 3 },
  listItem: { width: 820, fontSize: 42, minFontSize: 38, maxLines: 2 },
  bigNumber: { width: 840, fontSize: 200, minFontSize: 180, maxLines: 1 },
  subtitle: { width: 936, fontSize: 58, minFontSize: 42, maxLines: 2 }
});

export function collectTextFitDiagnostics(scenes = []) {
  const diagnostics = [];
  const add = (sceneIndex, role, text) => {
    if (typeof text !== "string" || !text.trim()) return;
    const limits = TEXT_ROLE_LIMITS[role];
    const result = measureTextFit(text, limits);
    diagnostics.push({ scene: sceneIndex + 1, role, text, ...result, boxWidth: limits.width });
  };
  scenes.forEach((scene, index) => {
    const data = scene.data || {};
    const layout = scene.layout || "headline";
    if (layout === "headline") {
      add(index, "headline", data.text || data.title || scene.textOnScreen || scene.text_on_screen || "");
    } else if (layout === "bignumber") {
      add(index, "bigNumber", String(data.value ?? ""));
      add(index, "cardBody", data.label || "");
    } else if (layout === "chart") {
      add(index, "chartTitle", data.title || "");
      for (const item of data.values || []) add(index, "chartLabel", item.label || "");
    } else if (layout === "timeline") {
      add(index, "cardTitle", data.title || "");
      for (const event of data.events || []) {
        add(index, "timelineTitle", event.title || "");
        add(index, "timelineBody", event.when || "");
        add(index, "timelineBody", event.description || "");
      }
    } else if (layout === "comparison") {
      add(index, "chartTitle", data.title || "");
      for (const side of [data.a || {}, data.b || {}]) {
        add(index, "comparisonLabel", side.label || "");
        add(index, "comparisonDetail", side.detail || "");
      }
    } else if (layout === "card") {
      add(index, "cardTitle", data.title || data.text || "");
      add(index, "cardBody", data.body || "");
    } else if (layout === "list") {
      add(index, "chartTitle", data.title || "");
      for (const item of data.items || []) add(index, "listItem", typeof item === "string" ? item : item.label || "");
    }
    if (Array.isArray(scene.subtitleWords)) {
      for (let start = 0; start < scene.subtitleWords.length; start += 5) {
        const group = scene.subtitleWords.slice(start, start + 5)
          .map(word => String(word.text || "")).filter(Boolean).join(" ");
        add(index, "subtitle", group);
      }
    }
  });
  return diagnostics;
}
