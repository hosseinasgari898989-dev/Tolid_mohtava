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
  staticFile,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";

import { VisualBackground } from "./backgrounds/NeonBackgrounds";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
};

const normalizeWord = value => String(value)
  .normalize("NFKC")
  .replace(/[يى]/g, "ی")
  .replace(/ك/g, "ک")
  .replace(/[^\p{L}\p{N}]/gu, "");

const baseFont = {
  fontFamily: "Vazirmatn, sans-serif",
  direction: "rtl",
  textAlign: "center",
  color: "white"
};

const SceneIcon = ({ name, frameOverride }) => {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: { damping: 13, stiffness: 120, mass: 0.75 }
  });
  const floatY = Math.sin(frame / 17) * 7;

  let artwork;
  switch (name) {
    case "brain":
      artwork = (
        <>
          <path d="M50 22 C36 8 18 20 23 36 C9 43 16 62 29 64 C25 81 45 88 55 75 C66 89 86 78 80 62 C96 54 88 35 75 34 C78 19 60 12 50 22Z" />
          <path d="M51 22 V76 M28 38 C42 35 43 48 34 54 M74 36 C60 36 59 49 69 55 M31 65 C43 62 45 71 42 77 M72 64 C60 61 58 70 63 78" />
        </>
      );
      break;
    case "low-battery":
      artwork = (
        <>
          <rect x="15" y="29" width="65" height="42" rx="6" />
          <path d="M80 42 H88 V58 H80 M23 37 H36 V63 H23Z" fill="#FFE082" stroke="none" />
          <path d="M45 42 V58" />
        </>
      );
      break;
    case "clock":
      artwork = (
        <>
          <circle cx="50" cy="50" r="34" />
          <path d="M50 29 V51 L66 61 M50 12 V18 M88 50 H82" />
        </>
      );
      break;
    case "lightbulb":
      artwork = (
        <>
          <path d="M34 59 C31 49 21 43 22 31 C23 14 37 7 50 7 C64 7 78 17 78 32 C78 44 68 51 66 60Z" />
          <path d="M36 68 H64 M39 77 H61 M44 85 H56 M50 18 V29 M36 29 L42 36 M64 29 L58 36" />
        </>
      );
      break;
    case "checklist":
      artwork = (
        <>
          <rect x="24" y="12" width="55" height="76" rx="7" />
          <path d="M35 33 L41 39 L52 26 M57 34 H69 M35 56 L41 62 L52 49 M57 57 H69 M36 76 H68" />
        </>
      );
      break;
    case "question":
      artwork = (
        <>
          <circle cx="50" cy="50" r="38" />
          <path d="M36 37 C37 22 65 21 67 38 C69 50 52 51 51 63 M51 76 V77" />
        </>
      );
      break;
    case "heart":
      artwork = (
        <path d="M50 82 C42 74 17 56 17 36 C17 14 43 9 50 29 C59 8 83 15 83 36 C83 56 59 75 50 82Z" />
      );
      break;
    case "eye":
      artwork = (
        <>
          <path d="M8 50 C20 28 35 18 50 18 C65 18 80 28 92 50 C80 72 65 82 50 82 C35 82 20 72 8 50Z" />
          <circle cx="50" cy="50" r="15" />
          <circle cx="50" cy="50" r="5" fill="#FFE082" stroke="none" />
        </>
      );
      break;
    default:
      return null;
  }

  return (
    <div
      style={{
        width: 220,
        height: 220,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: `translateY(${floatY}px) scale(${0.92 + entrance * 0.08})`,
        opacity: 1,
        filter: "drop-shadow(0 0 18px rgba(72,230,242,.55))"
      }}
    >
      <svg viewBox="0 0 100 100" width="100%" height="100%" fill="none"
        stroke="#FFE082" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round">
        {artwork}
      </svg>
    </div>
  );
};

const KineticText = ({ scene, isHook, frameOverride }) => {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  const { fps } = useVideoConfig();
  const words = scene.textOnScreen.trim().split(/\s+/u);
  const fontSize = isHook ? 130 : 120;
  const highlight = normalizeWord(scene.highlight || "");

  return (
    <div
      dir="rtl"
      style={{
        ...baseFont,
        maxWidth: 960,
        fontSize,
        fontWeight: 900,
        lineHeight: 1.3,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        columnGap: 17,
        rowGap: 0,
        textShadow: "0 5px 22px rgba(0,0,0,.82), 0 0 32px rgba(57,139,255,.55)",
        WebkitTextStroke: "1px rgba(3,8,22,.35)"
      }}
    >
      {words.map((word, index) => {
        const wordFrame = Math.max(0, frame - index * 2);
        const pop = spring({
          frame: wordFrame,
          fps,
          config: { damping: 12, stiffness: 160, mass: 0.62 }
        });
        const active = highlight && normalizeWord(word) === highlight;

        return (
          <span
            key={`${index}-${word}`}
            style={{
              display: "inline-block",
              color: active ? "#FFE082" : "#FFFFFF",
              opacity: 1,
              transform: `translateY(${(1 - pop) * 10}px) scale(${0.98 + pop * 0.02})`,
              textShadow: active
                ? "0 0 10px #FFE082, 0 0 26px rgba(255,224,130,.9), 0 5px 18px rgba(0,0,0,.9)"
                : "0 5px 18px rgba(0,0,0,.9)"
            }}
          >
            {word}
          </span>
        );
      })}
    </div>
  );
};

const SceneLayer = ({ scene, index, videoId, frameOverride }) => {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  const { fps } = useVideoConfig();
  const entrance = spring({
    frame,
    fps,
    config: { damping: 17, stiffness: 95, mass: 0.9 }
  });

  const cameraX = Math.sin(frame * 0.018 + index) * 7;
  const cameraY = Math.cos(frame * 0.014 + index * 0.7) * 9;
  const cameraScale = 1.045 + Math.sin(frame * 0.012) * 0.009;

  let transitionStyle = {};
  if (index === 0) {
    transitionStyle = {
      transform: "scale(" + (0.98 + entrance * 0.02) + ")"
    };
  } else if (scene.transition === "slide") {
    transitionStyle = {
      transform: "translateX(" + ((1 - entrance) * 135) + "px) scale(" + (0.98 + entrance * 0.02) + ")"
    };
  } else if (scene.transition === "glitch") {
    const jitter = frame < 7 ? Math.sin(frame * 5.2) * (7 - frame) * 2 : 0;
    transitionStyle = {
      transform: "translateX(" + jitter + "px) scale(" + (0.94 + entrance * 0.06) + ")",
      filter: frame < 7 ? "saturate(1.5) contrast(1.12)" : "none"
    };
  } else {
    transitionStyle = {
      transform: "scale(" + (0.95 + entrance * 0.05) + ")"
    };
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -24,
          transform: `translate(${cameraX}px, ${cameraY}px) scale(${cameraScale})`
        }}
      >
        <VisualBackground
          visual={scene.visual}
          videoId={videoId}
          sceneIndex={index}
          frameOverride={frameOverride}
        />
      </div>

      <AbsoluteFill
        style={{
          background:
            "radial-gradient(ellipse at 50% 42%, rgba(72,120,255,.12), transparent 48%), linear-gradient(180deg, rgba(4,8,22,.02), rgba(4,8,22,.13))",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 72px"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "17%",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center"
          }}
        >
          <SceneIcon name={scene.icon} frameOverride={frameOverride} />
        </div>

        <div
          style={{
            position: "absolute",
            top: "33%",
            left: 72,
            right: 72,
            height: "25%",
            minHeight: 280,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: 1,
            ...transitionStyle
          }}
        >
          <KineticText scene={scene} isHook={index === 0} frameOverride={frameOverride} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};


const SceneSubtitles = ({ scenes, fps, hideAfterFrame, frameOverride }) => {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;
  if (hideAfterFrame !== undefined && frame >= hideAfterFrame) return null;

  const seconds = frame / fps;
  const scene = scenes.find(item =>
    seconds >= item.startSeconds && seconds < item.endSeconds
  );
  if (!scene || !Array.isArray(scene.subtitleWords) || scene.subtitleWords.length === 0) {
    return null;
  }

  const timedWords = scene.subtitleWords;
  let activeIndex = timedWords.findIndex(word =>
    seconds >= word.startSeconds && seconds < word.endSeconds
  );

  if (activeIndex < 0) {
    let previousIndex = -1;
    for (let index = 0; index < timedWords.length; index++) {
      if (timedWords[index].startSeconds <= seconds) previousIndex = index;
      else break;
    }
    if (previousIndex < 0 ||
        seconds - timedWords[previousIndex].endSeconds > 0.28) return null;
    activeIndex = previousIndex;
  }

  const firstVisible = Math.max(0, activeIndex - 2);
  const visibleWords = timedWords.slice(firstVisible, activeIndex + 3);
  const normalizedHeadline = scene.textOnScreen.trim()
    .split(/\s+/u).map(normalizeWord).filter(Boolean).join(" ");
  const normalizedVisible = visibleWords
    .map(word => normalizeWord(word.text)).filter(Boolean).join(" ");

  // Keep the headline visible; suppress only a subtitle window that exactly duplicates it.
  if (normalizedVisible && normalizedVisible === normalizedHeadline) return null;

  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",
        top: "64%",
        left: 72,
        right: 72,
        height: "14%",
        maxWidth: 936,
        margin: "0 auto",
        padding: "10px 24px",
        overflow: "visible",
        display: "flex",
        flexWrap: "wrap",
        alignItems: "center",
        justifyContent: "center",
        columnGap: 13,
        rowGap: 8,
        ...baseFont,
        fontSize: 58,
        fontWeight: 900,
        lineHeight: 1.25,
        WebkitTextStroke: "3px #07101f",
        paintOrder: "stroke fill",
        textShadow: "0 4px 14px rgba(0,0,0,.98), 0 0 24px rgba(0,0,0,.8)"
      }}
    >
      {visibleWords.map((word, index) => {
        const isActive = firstVisible + index === activeIndex;
        const wordStartFrame = Math.round(word.startSeconds * fps);
        const pop = spring({
          frame: Math.max(0, frame - wordStartFrame),
          fps,
          config: { damping: 11, stiffness: 185, mass: 0.55 }
        });

        return (
          <span
            key={String(firstVisible + index) + "-" + word.text}
            style={{
              display: "inline-block",
              color: isActive ? "#FFE082" : "#FFFFFF",
              transform: "scale(" + (isActive ? 0.92 + pop * 0.14 : 1) + ")",
              transformOrigin: "center",
              WebkitTextStroke: "3px #07101f",
              paintOrder: "stroke fill",
              textShadow: isActive
                ? "0 0 9px #FFE082, 0 0 22px rgba(255,224,130,.75), 0 4px 14px rgba(0,0,0,.98)"
                : "0 4px 14px rgba(0,0,0,.98)"
            }}
          >
            {word.text}
          </span>
        );
      })}
    </div>
  );
};

const OUTRO_FRAMES = 45;

const BrandMark = () => (
  <div
    dir="rtl"
    style={{
      position: "absolute",
      top: "13%",
      right: 66,
      color: "white",
      fontSize: 38,
      fontWeight: 900,
      textShadow: "0 2px 14px black",
      zIndex: 5
    }}
  >
    ذهن‌خوان
  </div>
);

const ProgressBar = ({ progress }) => (
  <div
    style={{
      position: "absolute",
      top: "12%",
      left: 0,
      right: 0,
      height: 7,
      background: "rgba(255,255,255,.14)",
      zIndex: 6
    }}
  >
    <div
      style={{
        width: progress + "%",
        height: "100%",
        background: "#FFE082",
        boxShadow: "0 0 18px #FFE082"
      }}
    />
  </div>
);

const OutroBridge = ({
  lastScene,
  lastSceneIndex,
  firstScene,
  videoId,
  lastSceneDurationFrames
}) => {
  const frame = useCurrentFrame();
  const coverStart = OUTRO_FRAMES - 22;
  const coverOpacity = interpolate(frame, [coverStart, OUTRO_FRAMES - 1], [0, 1], clamp);
  const closingOpacity = interpolate(frame, [0, 3, 21, 28], [0, 1, 1, 0], clamp);
  const lastSceneFrame = Math.max(0, lastSceneDurationFrames - OUTRO_FRAMES + frame);
  const resetProgress = interpolate(frame, [coverStart, OUTRO_FRAMES - 1], [100, 0], clamp);

  return (
    <AbsoluteFill>
      <SceneLayer
        scene={lastScene}
        index={lastSceneIndex}
        videoId={videoId}
        frameOverride={lastSceneFrame}
      />
      <BrandMark />
      <ProgressBar progress={resetProgress} />
      <div
        dir="rtl"
        style={{
          position: "absolute",
          top: "55%",
          left: 72,
          right: 72,
          textAlign: "center",
          color: "#FFE082",
          fontFamily: "Vazirmatn, sans-serif",
          fontSize: 64,
          fontWeight: 900,
          opacity: closingOpacity,
          transform: "scale(" + (0.96 + closingOpacity * 0.04) + ")",
          WebkitTextStroke: "2px #07101f",
          paintOrder: "stroke fill",
          textShadow: "0 0 14px rgba(255,224,130,.75), 0 5px 20px rgba(0,0,0,.98)",
          zIndex: 12
        }}
      >
        فالو کن برای فردا
      </div>
      <AbsoluteFill style={{ opacity: coverOpacity, zIndex: 30 }}>
        <SceneLayer
          scene={firstScene}
          index={0}
          videoId={videoId}
          frameOverride={0}
        />
        <BrandMark />
        <SceneSubtitles scenes={[firstScene]} fps={30} frameOverride={0} />
        <ProgressBar progress={0} />
      </AbsoluteFill>
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
  const [fontHandle] = useState(
    () => delayRender("Loading Vazirmatn regular, bold and black fonts")
  );

  useEffect(() => {
    let cancelled = false;
    const loadFonts = async () => {
      try {
        const regular = await document.fonts.load('400 64px "Vazirmatn"');
        const bold = await document.fonts.load('700 64px "Vazirmatn"');
        const black = await document.fonts.load('900 112px "Vazirmatn"');
        await document.fonts.ready;
        if (!regular.length || !bold.length || !black.length) {
          throw new Error("Vazirmatn font files did not load.");
        }
        if (!cancelled) continueRender(fontHandle);
      } catch (error) {
        if (!cancelled) cancelRender(error);
      }
    };
    loadFonts();
    return () => { cancelled = true; };
  }, [fontHandle]);

  const frame = useCurrentFrame();
  const { fps, durationInFrames } = useVideoConfig();
  const progress = interpolate(frame, [0, durationInFrames - 1], [0, 100], clamp);
  const outroFrom = Math.max(0, durationInFrames - OUTRO_FRAMES);

  return (
    <AbsoluteFill style={{
      backgroundColor: "#080D20",
      overflow: "hidden",
      fontFamily: "Vazirmatn, sans-serif"
    }}>
      {scenes.map((scene, index) => {
        const duration = Math.max(1, scene.endFrame - scene.startFrame);
        return (
          <Sequence
            key={`${index}-${scene.startFrame}`}
            from={scene.startFrame}
            durationInFrames={duration}
          >
            <SceneLayer scene={scene} index={index} videoId={videoId} />
          </Sequence>
        );
      })}

      <Audio src={staticFile("audio.mp3")} volume={1} />


      {frame < outroFrom && <BrandMark />}
      <SceneSubtitles scenes={scenes} fps={fps} hideAfterFrame={outroFrom} />
      {frame < outroFrom && <ProgressBar progress={progress} />}

      <Sequence
        from={outroFrom}
        durationInFrames={Math.min(OUTRO_FRAMES, durationInFrames - outroFrom)}
      >
        <OutroBridge
          lastScene={scenes[scenes.length - 1]}
          lastSceneIndex={scenes.length - 1}
          firstScene={scenes[0]}
          videoId={videoId}
          lastSceneDurationFrames={
            scenes[scenes.length - 1].endFrame - scenes[scenes.length - 1].startFrame
          }
        />
      </Sequence>
    </AbsoluteFill>
  );
};
