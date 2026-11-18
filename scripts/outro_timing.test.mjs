import test from "node:test";
import assert from "node:assert/strict";

import {
  OUTRO_FRAMES,
  CTA_MIN_VISIBLE_FRAMES,
  getOutroFrameState,
  getSceneRenderDuration,
  hasMinimumCtaHold
} from "../src/outroTiming.js";

test("extends the final scene to the outro boundary instead of leaving a dark gap", () => {
  const finalScene = { startFrame: 483, endFrame: 675 };
  assert.equal(getSceneRenderDuration(finalScene, 4, 4, 703), 220);
});

test("does not alter earlier scenes or a final scene already extending past the outro", () => {
  assert.equal(getSceneRenderDuration({ startFrame: 110, endFrame: 297 }, 1, 4, 703), 187);
  assert.equal(getSceneRenderDuration({ startFrame: 483, endFrame: 720 }, 4, 4, 703), 237);
});

test("keeps the closing CTA fully visible for at least 1.2 seconds", () => {
  const fullOpacityFrames = Array.from({ length: OUTRO_FRAMES }, (_, frame) => frame)
    .filter(frame => getOutroFrameState(frame).closingOpacity === 1);
  assert.ok(hasMinimumCtaHold());
  assert.ok(fullOpacityFrames.length >= CTA_MIN_VISIBLE_FRAMES);
  assert.equal(fullOpacityFrames.length, 38);
});

test("crossfades into the first-frame cover without an uncovered end frame", () => {
  for (let frame = 40; frame < OUTRO_FRAMES; frame++) {
    const state = getOutroFrameState(frame);
    assert.ok(state.coverOpacity > 0 || state.closingOpacity > 0, "uncovered frame " + frame);
  }
  assert.deepEqual(getOutroFrameState(OUTRO_FRAMES - 1), {
    closingOpacity: 0,
    coverOpacity: 1
  });
});
