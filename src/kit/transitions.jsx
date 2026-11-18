import React from "react";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";

export const makeSceneTransition = (kind = "slide", durationInFrames = 18) => {
  let presentation = slide();
  if (kind === "wipe") {
    presentation = wipe();
  } else if (kind === "zoom") {
    presentation = slide({
      direction: "from-left",
      enterStyle: { transform: "scale(.88)" },
      exitStyle: { transform: "scale(1.10)" }
    });
  }
  return React.createElement(TransitionSeries.Transition, {
    timing: linearTiming({ durationInFrames }),
    presentation
  });
};
