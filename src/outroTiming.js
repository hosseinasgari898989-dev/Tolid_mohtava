export const OUTRO_FRAMES = 45;
export const CTA_MIN_VISIBLE_FRAMES = Math.ceil(1.2 * 30);

export const CTA_FULL_OPACITY_START_FRAME = 2;
export const CTA_FULL_OPACITY_END_FRAME = 39;
export const CTA_FADE_OUT_END_FRAME = 43;
export const COVER_FADE_START_FRAME = OUTRO_FRAMES - 5;

const clamp01 = value => Math.max(0, Math.min(1, value));

export const getOutroFrameState = frame => {
  const closingFadeIn = clamp01(frame / CTA_FULL_OPACITY_START_FRAME);
  const closingFadeOut = 1 - clamp01(
    (frame - CTA_FULL_OPACITY_END_FRAME) /
      (CTA_FADE_OUT_END_FRAME - CTA_FULL_OPACITY_END_FRAME)
  );
  const closingOpacity = Math.min(closingFadeIn, closingFadeOut);
  const coverOpacity = clamp01(
    (frame - COVER_FADE_START_FRAME) /
      (OUTRO_FRAMES - 1 - COVER_FADE_START_FRAME)
  );
  return { closingOpacity, coverOpacity };
};

export const getSceneRenderDuration = (scene, index, lastSceneIndex, outroFrom) => {
  const authoredDuration = Math.max(1, scene.endFrame - scene.startFrame);
  if (index !== lastSceneIndex) return authoredDuration;
  return Math.max(authoredDuration, Math.max(1, outroFrom - scene.startFrame));
};

export const hasMinimumCtaHold = () =>
  CTA_FULL_OPACITY_END_FRAME - CTA_FULL_OPACITY_START_FRAME + 1 >= CTA_MIN_VISIBLE_FRAMES;
