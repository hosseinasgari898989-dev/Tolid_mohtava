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

const SceneIcon = ({ name }) => {
  const frame = useCurrentFrame();
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
        width: 150,
        height: 150,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transform: \`translateY(${floatY}px) scale(${0.72 + entrance * 0.28})\`,
        opacity: interpolate(frame, [0, 5], [0.25, 1], clamp),
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

const KineticText = ({ scene, isHook }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const words = scene.textOnScreen.trim().split(/\s+/u);
  const fontSize = isHook
    ? interpolate(frame, [0, 45], [112, 88], clamp)
    : 90;
  const highlight = normalizeWord(scene.highlight || "");

  return (
    <div
      dir="rtl"
      style={{
        ...baseFont,
        maxWidth: 940,
        fontSize,
        fontWeight: 900,
        lineHeight: 1.55,
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
            key={\`${index}-${word}\`}
            style={{
              display: "inline-block",
              color: active ? "#FFE082" : "#FFFFFF",
              opacity: interpolate(wordFrame, [0, 3], [0.08, 1], clamp),
              transform: \`translateY(${(1 - pop) * 32}px) scale(${0.68 + pop * 0.32})\`,
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

const SceneLayer = ({ scene, index, videoId }) => {
  const frame = useCurrentFrame();
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
  if (scene.transition === "slide") {
    transitionStyle = {
      transform: \`translateX(${(1 - entrance) * 135}px) scale(${0.98 + entrance * 0.02})\`
    };
  } else if (scene.transition === "glitch") {
    const jitter = frame < 7 ? Math.sin(frame * 5.2) * (7 - frame) * 2 : 0;
    transitionStyle = {
      transform: \`translateX(${jitter}px) scale(${0.94 + entrance * 0.06})\`,
      filter: frame < 7 ? "saturate(1.5) contrast(1.12)" : "none"
    };
  } else {
    transitionStyle = {
      transform: \`scale(${0.82 + entrance * 0.18})\`
    };
  }

  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          inset: -24,
          transform: \`translate(${cameraX}px, ${cameraY}px) scale(${cameraScale})\`
        }}
      >
        <VisualBackground
          visual={scene.visual}
          videoId={videoId}
          sceneIndex={index}
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
            top: "23%",
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center"
          }}
        >
          <SceneIcon name={scene.icon} />
        </div>

        <div
          style={{
            position: "absolute",
            top: "34%",
            left: 58,
            right: 58,
            minHeight: 300,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            opacity: interpolate(frame, [0, 3], [0.12, 1], clamp),
            ...transitionStyle
          }}
        >
          <KineticText scene={scene} isHook={index === 0} />
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

const WordSubtitles = ({ words, fps }) => {
  const frame = useCurrentFrame();
  const seconds = frame / fps;
  if (!Array.isArray(words) || words.length === 0) return null;

  let activeIndex = -1;
  for (let index = 0; index < words.length; index++) {
    if (seconds >= words[index].start) activeIndex = index;
    else break;
  }
  if (activeIndex < 0 || seconds > words[words.length - 1].end + 0.04) {
    return null;
  }

  const first = Math.max(0, activeIndex - 2);
  const visibleWords = words.slice(first, Math.min(words.length, activeIndex + 3));

  return (
    <div
      dir="rtl"
      style={{
        position: "absolute",
        top: "61%",
        left: 58,
        right: 58,
        minHeight: 170,
        display: "flex",
        flexWrap: "wrap",
        justifyContent: "center",
        alignContent: "center",
        alignItems: "center",
        gap: "4px 15px",
        padding: 0,
        ...baseFont,
        fontSize: 58,
        fontWeight: 900,
        lineHeight: 1.6,
        WebkitTextStroke: "2.5px #07101f",
        paintOrder: "stroke fill",
        textShadow: "0 4px 14px rgba(0,0,0,.98), 0 0 24px rgba(0,0,0,.8)"
      }}
    >
      {visibleWords.map((word, index) => {
        const realIndex = first + index;
        const active = realIndex === activeIndex;
        const elapsed = Math.max(0, frame - Math.round(word.start * fps));
        const pop = active
          ? spring({ frame: elapsed, fps, config: { damping: 11, stiffness: 190 } })
          : 1;

        return (
          <span
            key={\`${word.start}-${realIndex}\`}
            style={{
              display: "inline-block",
              color: active ? "#FFE082" : "#FFFFFF",
              transform: active ? \`scale(${0.94 + pop * 0.12})\` : "scale(1)",
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

const BrandOutro = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const scale = spring({
    frame,
    fps,
    config: { damping: 14, stiffness: 100 }
  });
  const contentOpacity = interpolate(frame, [0, 8, 37, 48], [0, 1, 1, 1], clamp);

  return (
    <AbsoluteFill
      style={{
        background: "#080D20",
        alignItems: "center",
        justifyContent: "center",
        ...baseFont,
        zIndex: 20
      }}
    >
      <div
        style={{
          opacity: contentOpacity,
          fontSize: 100,
          fontWeight: 900,
          transform: \`scale(${0.78 + scale * 0.22})\`,
          color: "#FFE082",
          textShadow: "0 0 28px rgba(255,224,130,.55)"
        }}
      >
        ذهن‌خوان
      </div>
      <div style={{
        opacity: contentOpacity,
        fontSize: 42,
        fontWeight: 700,
        marginTop: 24,
        textShadow: "0 4px 18px black"
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
  const outroFrom = Math.max(0, durationInFrames - 48);

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
            key={\`${index}-${scene.startFrame}\`}
            from={scene.startFrame}
            durationInFrames={duration}
          >
            <SceneLayer scene={scene} index={index} videoId={videoId} />
          </Sequence>
        );
      })}

      <Audio src={staticFile("audio.mp3")} volume={1} />

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

      <WordSubtitles words={words} fps={fps} />

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
        <div style={{
          width: \`${progress}%\`,
          height: "100%",
          background: "#FFE082",
          boxShadow: "0 0 18px #FFE082"
        }} />
      </div>

      <Sequence
        from={outroFrom}
        durationInFrames={Math.max(1, durationInFrames - outroFrom)}
      >
        <BrandOutro />
      </Sequence>
    </AbsoluteFill>
  );
};
