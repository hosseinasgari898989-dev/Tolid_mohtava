import test from "node:test";
import assert from "node:assert/strict";
import {
  VIDEO_LAYOUTS,
  fitFontSize,
  isValidLayout,
  normalizePersianText,
  toPersianDigits
} from "../src/kit/layout-utils.js";

test("Persian digit conversion preserves non-digit text", () => {
  assert.equal(toPersianDigits("Mind 2026 / 1080"), "Mind ۲۰۲۶ / ۱۰۸۰");
});
test("Persian normalization handles Arabic letter variants", () => {
  assert.equal(normalizePersianText("ك ي"), "ک ی");
});
test("all scene layout kinds are explicitly supported", () => {
  assert.deepEqual(VIDEO_LAYOUTS, ["headline", "bignumber", "chart", "timeline", "comparison", "card", "list"]);
  for (const layout of VIDEO_LAYOUTS) assert.equal(isValidLayout(layout), true);
  assert.equal(isValidLayout("unknown"), false);
});
test("long on-screen copy gets a smaller safe font size", () => {
  const short = fitFontSize("یک حقیقت", { width: 860, fontSize: 80, minFontSize: 30 });
  const long = fitFontSize("این یک عنوان طولانی برای نمایش در قاب عمودی است", { width: 860, fontSize: 80, minFontSize: 30 });
  assert.ok(short >= long);
  assert.ok(long >= 30);
});
