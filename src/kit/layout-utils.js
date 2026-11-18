import { PERSIAN_DIGITS } from "../../design/tokens.js";

const PERSIAN_SCRIPT = /[\u0600-\u06FF]/u;
export const VIDEO_LAYOUTS = Object.freeze(["headline", "bignumber", "chart", "timeline", "comparison", "card", "list"]);
export const toPersianDigits = (value) => String(value).replace(/[0-9]/g, (digit) => PERSIAN_DIGITS[Number(digit)]);
export const normalizePersianText = (value) => String(value ?? "").normalize("NFKC").replace(/[يى]/g, "ی").replace(/ك/g, "ک").replace(/\u0640/g, "").trim();

const glyphWidth = (character) => {
  if (/\s/u.test(character)) return 0.28;
  if (/[0-9۰-۹]/u.test(character)) return 0.58;
  if (/[A-Za-z]/u.test(character)) return 0.56;
  if (PERSIAN_SCRIPT.test(character)) return 0.57;
  return 0.62;
};
export const estimateLineWidth = (text) => Array.from(String(text)).reduce((sum, character) => sum + glyphWidth(character), 0);

export const fitFontSize = (text, { width = 860, fontSize = 76, minFontSize = 32, maxLines = 3 } = {}) => {
  const words = normalizePersianText(text).split(/\s+/u).filter(Boolean);
  if (words.length === 0) return minFontSize;
  let line = "";
  let longestLine = 0;
  let lineCount = 1;
  for (const word of words) {
    const candidate = line ? line + " " + word : word;
    if (line && estimateLineWidth(candidate) > width / fontSize) {
      longestLine = Math.max(longestLine, estimateLineWidth(line));
      line = word;
      lineCount += 1;
    } else {
      line = candidate;
    }
  }
  longestLine = Math.max(longestLine, estimateLineWidth(line));
  const widthScale = Math.min(1, width / (longestLine * fontSize));
  const lineScale = Math.min(1, maxLines / lineCount);
  return Math.max(minFontSize, Math.floor(fontSize * Math.min(widthScale, lineScale)));
};
export const fitTextStyle = (text, options = {}) => ({
  fontSize: fitFontSize(text, options),
  lineHeight: 1.25,
  maxWidth: options.width ?? 860,
  direction: "rtl",
  textAlign: "center",
  overflowWrap: "anywhere",
  wordBreak: "normal"
});
export const isValidLayout = (layout) => VIDEO_LAYOUTS.includes(layout);
