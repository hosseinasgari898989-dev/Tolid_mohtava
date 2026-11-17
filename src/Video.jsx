import React, { useEffect, useState } from "react";

import {
  AbsoluteFill,
  Audio,
  Sequence,
  cancelRender,
  continueRender,
  delayRender,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/700.css";

import { VisualBackground } from "./backgrounds/NeonBackgrounds";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
};

const baseFont = {
  fontFamily: "Vazirmatn, sans-serif",
  direction: "rtl",
  textAlign: "center",
  color: "white"
};

// Template 1: psychology facts.
const FactsTemplate = ({ text }) => (
  <div style={baseFont}>
    <div style={{
      fontSize: 34,
      color: "#FFE082",
      marginBottom: 24
    }}>
      دانستنی روان‌شناسی
    </div>

    <div style={{
      fontSize: 64,
      fontWeight: 700,
      lineHeight: 1.5,
      textShadow: "0 4px 18px #000"
    }}>
      {text}
    </div>
  </div>
);

// Template 2: show only the supplied numbered text.
const ListTemplate = ({ text }) => (
  <div style={baseFont}>
    <div style={{
      fontSize: 62,
      fontWeight: 700,
      lineHeight: 1.5,
      textShadow: "0 4px 18px #000"
    }}>
      {text}
    </div>
  </div>
);

// Template 3: questions.
const QuestionTemplate = ({ text }) => (
  <div style={{
    ...baseFont,
    background: "rgba(12, 20, 45, 0.55)",
    border: "2px solid rgba(255,255,255,0.35)",
    borderRadius: 34,
    padding: 42
  }}>
    <div style={{
      fontSize: 36,
      color: "#FFE082",
      marginBottom: 24
    }}>
      یک سؤال برای ذهنت
    </div>

    <div style={{
      fontSize: 64,
      fontWeight: 700,
      lineHeight: 1.5
    }}>
      {text}
    </div>
  </div>
};

const TemplateText = ({ template, text }) => {
  if (template === "list") {
    return <ListTemplate text={text} />;
  }

  if (template === "question") {
    return <QuestionTemplate text={text} />;
  }

  return <FactsTemplate text={text} />;
};

// One original animated background and one text layer per scene.
const SceneLayer = ({
  scene,
  index,
  total,
  videoId,
  template,
  duration
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const fadeIn = index === 0
    ? 1
    : interpolate(frame, [0, 12], [0, 1], clamp);

  const fadeOut = index === total - 1
    ? 1
    : interpolate(
        frame,
        [Math.max(0, duration - 12), duration],
        [1, 0],
        clamp
      );

  const opacity = Math.min(fadeIn, fadeOut);

  const movement = spring({
    frame,
    fps,
    config: {
      damping: 17,
      stiffness: 110
    }
  });

  return (
    <AbsoluteFill style={{ opacity }}>
      <VisualBackground
        visual={scene.visual}
        videoId={videoId}
        sceneIndex={index}
      />

      <AbsoluteFill
        style={{
          justifyContent: "center",
          alignItems: "center",
          padding: 80
        }}
      >
        <div
          dir="rtl"
          style={{
            maxWidth: "100%",
            opacity: movement,
            transform:
              `translateY(${(1 - movement) * 35}px) scale(${0.96 + movement * 0.04})`
          }}
        >
          <TemplateText
            template={template}
            text={scene.textOnScreen}
          />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// Word-by-word RTL subtitles.
const WordSubtitles = ({ words, fps }) => {
  const frame = useCurrentFrame();
  const seconds = frame / fps;

  if (!words || words.length === 0) {
    return null;
  }

  let activeIndex = 0;

  for (let index = 0; index < words.length; index++) {
    if (seconds >= words[index].start) {
      activeIndex = index;
    } else {
      break;
    }
  }

  const first = Math.max(0, activeIndex - 3);
  const visibleWords = words.slice(first, activeIndex + 4);

  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",
        bottom: 240,
        left: 70,
        right: 70,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 12,
        padding: 18,
        ...baseFont,
        fontSize: 42,
        fontWeight: 700,
        lineHeight: 1.8
      }}
    >
      {visibleWords.map((word, index) => {
        const realIndex = first + index;
        const active = realIndex === activeIndex;

        return (
          <span
            key={`${word.start}-${index}`}
            style={{
              padding: "3px 12px",
              borderRadius: 12,
              background: active
                ? "#FFE082"
                : "rgba(0,0,0,0.68)",
              color: active ? "#161616" : "#FFFFFF",
              unicodeBidi: "isolate"
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};

// Branded outro only. No intro: the first scene is the hook.
const BrandOutro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const scale = spring({
    frame,
    fps,
    config: {
      damping: 14,
      stiffness: 100
    }
  });

  const opacity = interpolate(
    frame,
    [0, 8, 35, 48],
    [0, 1, 1, 0],
    clamp
  );

  return (
    <AbsoluteFill
      style={{
        background: "rgba(7, 12, 32, 0.82)",
        alignItems: "center",
        justifyContent: "center",
        opacity,
        ...baseFont
      }}
    >
      <div
        style={{
          fontSize: 94,
          fontWeight: 700,
          transform: `scale(${0.8 + scale * 0.2})`,
          color: "#FFE082"
        }}
      >
        ذهن‌خوان
      </div>

      <div style={{
        fontSize: 34,
        marginTop: 24
      }}>
        فالو کن برای فردا
      </div>
    </AbsoluteFill>
  );
};

export const Video = ({
  videoId,
  title,
  template,
  scenes,
  words,
  audioDuration
}) => {
  // Wait for local Vazirmatn regular and bold font files.
  const [fontHandle] = useState(
    () => delayRender("Loading Vazirmatn regular and bold fonts")
  );

  useEffect(() => {
    let cancelled = false;

    const loadFonts = async () => {
      try {
        const regular = await document.fonts.load(
          '400 64px "Vazirmatn"'
        );
        const bold = await document.fonts.load(
          '700 64px "Vazirmatn"'
        );

        await document.fonts.ready;

        if (!regular.length || !bold.length) {
          throw new Error("Vazirmatn font files did not load.");
        }

        if (!cancelled) {
          continueRender(fontHandle);
        }
      } catch (error) {
        if (!cancelled) {
          cancelRender(error);
        }
      }
    };

    loadFonts();

    return () => {
      cancelled = true;
    };
  }, [fontHandle]);

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();

  const count = scenes.length;
  const overlap = 12;

  const sceneSpan = Math.ceil(
    (durationInFrames + overlap * Math.max(0, count - 1)) /
    Math.max(1, count)
  );

  const progress = interpolate(
    frame,
    [0, durationInFrames - 1],
    [0, 100],
    clamp
  );

  return (
    <AbsoluteFill style={{
      backgroundColor: "#080D20",
      overflow: "hidden",
      fontFamily: "Vazirmatn, sans-serif"
    }}>

      {/* Background scenes overlap for a 12-frame crossfade. */}
      {scenes.map((scene, index) => {
        const start = index * (sceneSpan - overlap);

        const duration = Math.min(
          sceneSpan,
          durationInFrames - start
        );

        if (duration <= 0) return null;

        return (
          <Sequence
            key={`${index}-${scene.visual || "auto"}`}
            from={start}
            durationInFrames={duration}
          >
            <SceneLayer
              scene={scene}
              index={index}
              total={count}
              videoId={videoId}
              template={template}
              duration={duration}
            />
          </Sequence>
        );
      })}

      <Audio src={staticFile("audio.mp3")} volume={1} />

      <div
        dir="rtl"
        style={{
          position: "absolute",
          top: 70,
          right: 65,
          color: "white",
          fontSize: 34,
          fontWeight: 700,
          textShadow: "0 2px 12px black"
        }}
      >
        ذهن‌خوان
      </div>

      <WordSubtitles words={words} fps={fps} />

      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 10,
          background: "rgba(255,255,255,.2)"
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            background: "#FFE082"
          }}
        />
      </div>

      <Sequence
        from={Math.max(0, durationInFrames - 48)}
        durationInFrames={48}
      >
        <BrandOutro />
      </Sequence>
    </AbsoluteFill>
  );
};
