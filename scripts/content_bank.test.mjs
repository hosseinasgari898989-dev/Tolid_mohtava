import test from "node:test";
import fs from "node:fs";
import assert from "node:assert/strict";
import { validateContentBank } from "./content_bank.mjs";

const makeItem = (overrides = {}) => ({
  id: "sample-001",
  status: "pending",
  topic: "space",
  layout: "comparison",
  data: {},
  voiceover: "یک حقیقت کوتاه.",
  scenes: [{
    narration: "یک حقیقت کوتاه.",
    text_on_screen: "یک حقیقت",
    highlight: "حقیقت",
    icon: "sparkles",
    layout: "headline",
    data: { text: "یک حقیقت" }
  }],
  caption: "شرح کوتاه",
  hashtags: ["#space"],
  fact_source: "https://example.org/source",
  ...overrides
});

test("accepts the V2 content-bank shape and V1-compatible optional extras", () => {
  assert.equal(validateContentBank([makeItem()]).count, 1);
  assert.equal(validateContentBank([makeItem({ template: "legacy" })]).count, 1);
});

test("rejects duplicate ids", () => {
  assert.throws(() => validateContentBank([makeItem(), makeItem()]), /Duplicate content id/);
});

test("keeps unverified pending content in draft", () => {
  assert.throws(
    () => validateContentBank([makeItem({ fact_source: "TO_VERIFY" })]),
    /keep this item draft/
  );
  assert.equal(validateContentBank([makeItem({ status: "draft", fact_source: "TO_VERIFY" })]).count, 1);
});

test("rejects more than five hashtags and invalid layouts", () => {
  assert.throws(
    () => validateContentBank([makeItem({ hashtags: ["#1", "#2", "#3", "#4", "#5", "#6"] })]),
    /maximum is 5/
  );
  assert.throws(
    () => validateContentBank([makeItem({ layout: "orbit" })]),
    /invalid layout/
  );
});

test("requires fact source and complete per-scene layout data", () => {
  assert.throws(
    () => validateContentBank([makeItem({ fact_source: "" })]),
    /fact_source is required/
  );
  assert.throws(
    () => validateContentBank([makeItem({ scenes: [{ narration: "سلام" }] })]),
    /text_on_screen is required/
  );
});

test("the complete legacy production bank remains backward compatible", () => {
  const bank = JSON.parse(fs.readFileSync(new URL("../content_bank.json", import.meta.url), "utf8"));
  const result = validateContentBank(bank, "content_bank.json");
  assert.equal(result.count, bank.length);
  assert.ok(bank.some(item => item.status === "done"));
  assert.ok(bank.some(item => item.status === "draft" && item.fact_source === "TO_VERIFY"));
  assert.ok(bank.every(item => item.hashtags.length <= 5));
});

test("the three verified fact-test items validate with distinct layouts", () => {
  const bank = JSON.parse(fs.readFileSync(new URL("../content_bank_test.json", import.meta.url), "utf8"));
  const result = validateContentBank(bank, "content_bank_test.json");
  assert.equal(result.count, 3);
  assert.deepEqual(new Set(bank.map(item => item.layout)), new Set(["comparison", "timeline", "card"]));
  assert.ok(bank.every(item => item.status === "pending" && !isUnverifiedSource(item.fact_source)));
});

test("restores existing narration, TTS, icon and transition guardrails", () => {
  assert.throws(
    () => validateContentBank([makeItem({ voiceover: "فقط یک جمله." })]),
    /scene narration must cover the voiceover exactly/
  );
  assert.throws(
    () => validateContentBank([makeItem({ rate: "fast" })]),
    /rate must use a value/
  );
  assert.throws(
    () => validateContentBank([makeItem({ scenes: [{ ...makeItem().scenes[0], icon: "unknown" }] })]),
    /unsupported icon/
  );
  assert.throws(
    () => validateContentBank([makeItem({ scenes: [{ ...makeItem().scenes[0], transition: "spin" }] })]),
    /invalid transition/
  );
});
