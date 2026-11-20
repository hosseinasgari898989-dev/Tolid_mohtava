import React from "react";
import { Composition } from "remotion";

import { Video } from "./Video";
import { KitDemo } from "./kit/DemoComposition.jsx";

export const Root = () => {
  return (
    <>
    <Composition
      id="Video"
      component={Video}
      width={1080}
      height={1920}
      fps={30}
      durationInFrames={1800}
      defaultProps={{
        title: "ذهن‌خوان",
        template: "facts",
        audioDuration: 5,
        scenes: [],
        words: []
      }}
      calculateMetadata={({ props }) => ({
        durationInFrames: Math.ceil(
          (props.audioDuration + 1.5) * 30
        )
      })}
    />
    <Composition id="kit-demo" component={KitDemo} width={1080} height={1920} fps={30} durationInFrames={630} />
    </>
  );
};
