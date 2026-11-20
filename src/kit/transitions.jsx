import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

export const makeSceneTransition = (kind = "slide", durationInFrames = 18) => {
  // No scale-based entrance/exit: every composition keeps a full-bleed brand canvas.
  const presentation = kind === "wipe"
    ? wipe()
    : slide({ direction: "from-left" });
  return React.createElement(TransitionSeries.Transition, {
    timing: linearTiming({ durationInFrames }),
    presentation
  });
};
