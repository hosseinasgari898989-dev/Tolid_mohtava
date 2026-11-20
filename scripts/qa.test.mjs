import test from "node:test";
import assert from "node:assert/strict";
import { measureTextFit, collectTextFitDiagnostics, isKeyContentAreaSafe, isProductionLayoutSafe, KEY_CONTENT_AREA, KEY_CONTENT_SAFE_AREA, PRODUCTION_VISUAL_AREA, SUBTITLE_AREA } from "../src/kit/layout-utils.js";
import { validateSubtitleTimings } from "./content_bank.mjs";

test("text fitting preserves the declared minimum for concise Persian headlines", () => {
  const result = measureTextFit("یک حقیقت روشن", { width: 936, fontSize: 108, minFontSize: 90, maxLines: 3 });
  assert.ok(result.fontSize >= 90);
  assert.equal(result.requiresBelowMinimum, false);
});

test("text fitting reports blocks that cannot fit at the minimum size", () => {
  const result = measureTextFit("کلمه بسیارطولانی".repeat(20), { width: 300, fontSize: 108, minFontSize: 90, maxLines: 2 });
  assert.equal(result.requiresBelowMinimum, true);
});

test("layout diagnostics cover headline, comparison labels and card body", () => {
  const report = collectTextFitDiagnostics([
    { layout: "headline", textOnScreen: "یک عنوان کوتاه", data: { text: "یک عنوان کوتاه" } },
    { layout: "comparison", data: { title: "مقایسه", a: { label: "روز", detail: "۲۴۳ روز" }, b: { label: "سال", detail: "۲۲۵ روز" } } },
    { layout: "card", data: { title: "سه قلب", body: "یک توضیح کوتاه و روشن." } }
  ]);
  assert.ok(report.some(item => item.role === "headline"));
  assert.ok(report.some(item => item.role === "cardBody"));
  assert.ok(report.every(item => item.minFontSize > 0));
});

test("subtitle timing accepts monotonic word boundaries inside the audio", () => {
  const errors = validateSubtitleTimings([
    { subtitleWords: [{ text: "یک", startSeconds: 0.1, endSeconds: 0.25 }, { text: "روز", startSeconds: 0.3, endSeconds: 0.5 }] }
  ], 1);
  assert.deepEqual(errors, []);
});

test("subtitle timing rejects overlap and timings beyond the audio", () => {
  const errors = validateSubtitleTimings([
    { subtitleWords: [{ text: "یک", startSeconds: 0.1, endSeconds: 0.4 }, { text: "روز", startSeconds: 0.3, endSeconds: 0.7 }] }
  ], 0.6);
  assert.ok(errors.some(error => error.includes("not monotonic")));
  assert.ok(errors.some(error => error.includes("exceeds audio duration")));
});

test("key scene content remains inside the approved 12%-72% vertical safe area", () => {
  assert.equal(isKeyContentAreaSafe(), true);
  assert.ok(KEY_CONTENT_AREA.top >= KEY_CONTENT_SAFE_AREA.top);
  assert.ok(KEY_CONTENT_AREA.bottom <= KEY_CONTENT_SAFE_AREA.bottom);
});

test("production visual content and subtitles are separated inside the 12%-72% safe area", () => {
  assert.equal(isProductionLayoutSafe(), true);
  assert.ok(PRODUCTION_VISUAL_AREA.bottom < SUBTITLE_AREA.top);
  assert.ok(SUBTITLE_AREA.bottom <= KEY_CONTENT_SAFE_AREA.bottom);
});
