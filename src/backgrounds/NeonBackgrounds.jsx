import React, { useMemo } from "react";
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig
} from "remotion";

const NAVY = "#080D20";
const BLUE = "#398BFF";
const PURPLE = "#9B6BFF";
const CYAN = "#48E6F2";
const GOLD = "#FFE082";

const clamp = {
  extrapolateLeft: "clamp",
  extrapolateRight: "clamp"
};

export function hashSeed(value = "") {
  let hash = 2166136261;

  for (let index = 0; index < value.length; index++) {
    hash = Math.imul(hash ^ value.charCodeAt(index), 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed) {
  let state = seed >>> 0 || 1;

  return () => {
    state = (Math.imul(state, 1664525) + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function GlowDefs({ id }) {
  return (
    <defs>
      <filter id={id} x="-100%" y="-100%" width="300%" height="300%">
        <feGaussianBlur stdDeviation="8" result="blur" />
        <feMerge>
          <feMergeNode in="blur" />
          <feMergeNode in="SourceGraphic" />
        </feMerge>
      </filter>

      <radialGradient id={`${id}-background`}>
        <stop offset="0%" stopColor="#182A57" stopOpacity="0.82" />
        <stop offset="100%" stopColor={NAVY} stopOpacity="0" />
      </radialGradient>

      <linearGradient id={`${id}-neon`} x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor={BLUE} />
        <stop offset="50%" stopColor={PURPLE} />
        <stop offset="100%" stopColor={CYAN} />
      </linearGradient>
    </defs>
  );
}

export const NeuralBackground = ({ seed }) => {
  const frame = useCurrentFrame();

  const nodes = useMemo(() => {
    const random = createRandom(seed);
    return Array.from({ length: 20 }, (_, index) => {
      const row = Math.floor(index / 5);
      const column = index % 5;

      return {
        x: 110 + column * 215 + (random() - 0.5) * 90,
        y: 260 + row * 455 + (random() - 0.5) * 150,
        phase: random() * Math.PI * 2,
        radius: 4 + random() * 5
      };
    });
  }, [seed]);

  const points = nodes.map(node => ({
    ...node,
    x: node.x + Math.sin(frame * 0.009 + node.phase) * 22,
    y: node.y + Math.cos(frame * 0.008 + node.phase) * 28
  }));

  const edges = [];

  for (let row = 0; row < 4; row++) {
    for (let column = 0; column < 5; column++) {
      const index = row * 5 + column;

      if (column < 4) edges.push([index, index + 1]);
      if (row < 3) edges.push([index, index + 5]);
      if (row < 3 && column < 4) edges.push([index, index + 6]);
    }
  }

  const id = `neural-${seed}`;

  return (
    <svg viewBox="0 0 1080 1920" width="1080" height="1920">
      <GlowDefs id={id} />
      <rect width="1080" height="1920" fill={NAVY} />
      <circle cx="540" cy="950" r="760" fill={`url(#${id}-background)`} />

      <g stroke={CYAN} strokeWidth="2" opacity="0.24">
        {edges.map(([from, to], index) => (
          <line
            key={index}
            x1={points[from].x}
            y1={points[from].y}
            x2={points[to].x}
            y2={points[to].y}
          />
        ))}
      </g>

      <g filter={`url(#${id})`}>
        {points.map((point, index) => (
          <g key={index}>
            <circle
              cx={point.x}
              cy={point.y}
              r={point.radius * 3}
              fill={index % 3 === 0 ? PURPLE : BLUE}
              opacity="0.14"
            />
            <circle
              cx={point.x}
              cy={point.y}
              r={point.radius}
              fill={index % 3 === 0 ? GOLD : CYAN}
            />
          </g>
        ))}
      </g>

      <circle
        cx="540"
        cy="960"
        r="720"
        fill="none"
        stroke={PURPLE}
        strokeWidth="2"
        opacity="0.1"
      />
    </svg>
  );
};

export const ParticlesBackground = ({ seed }) => {
  const frame = useCurrentFrame();

  const particles = useMemo(() => {
    const random = createRandom(seed);

    return Array.from({ length: 54 }, (_, index) => ({
      x: 35 + random() * 1010,
      y: random() * 1920,
      size: 2 + random() * 7,
      speed: 0.22 + random() * 0.85,
      drift: 10 + random() * 36,
      phase: random() * Math.PI * 2,
      color: [BLUE, PURPLE, CYAN, GOLD][index % 4],
      opacity: 0.28 + random() * 0.55
    }));
  }, [seed]);

  const id = `particles-${seed}`;

  return (
    <svg viewBox="0 0 1080 1920" width="1080" height="1920">
      <GlowDefs id={id} />
      <rect width="1080" height="1920" fill={NAVY} />
      <circle cx="210" cy="500" r="520" fill={`url(#${id}-background)`} />

      <g filter={`url(#${id})`}>
        {particles.map((particle, index) => {
          const y = (
            (particle.y - frame * particle.speed) % 2020 + 2020
          ) % 2020;
          const x = particle.x +
            Math.sin(frame * 0.008 + particle.phase) * particle.drift;

          const parallax = 0.55 + particle.size / 14;

          return (
            <g key={index} opacity={particle.opacity}>
              <circle
                cx={x}
                cy={y}
                r={particle.size * 2.8}
                fill={particle.color}
                opacity="0.18"
              />
              <circle
                cx={x}
                cy={y}
                r={particle.size * parallax}
                fill={particle.color}
              />
            </g>
          );
        })}
      </g>
    </svg>
  );
};

export const WavesBackground = ({ seed }) => {
  const frame = useCurrentFrame();

  const random = createRandom(seed);
  const layers = Array.from({ length: 8 }, (_, index) => ({
    base: 320 + index * 190,
    amplitude: 55 + random() * 65,
    phase: random() * Math.PI * 2,
    speed: 0.009 + random() * 0.006,
    color: [BLUE, PURPLE, CYAN, GOLD][index % 4]
  }));

  const paths = layers.map(layer => {
    const points = [];

    for (let x = -30; x <= 1110; x += 30) {
      const y = layer.base
        + Math.sin(x * 0.006 + frame * layer.speed + layer.phase) * layer.amplitude
        + Math.sin(x * 0.003 - frame * layer.speed * 0.65) * layer.amplitude * 0.48;

      points.push(`${x},${y}`);
    }

    return `M ${points.join(" L ")}`;
  });

  const id = `waves-${seed}`;

  return (
    <svg viewBox="0 0 1080 1920" width="1080" height="1920">
      <GlowDefs id={id} />
      <rect width="1080" height="1920" fill={NAVY} />
      <circle cx="760" cy="860" r="700" fill={`url(#${id}-background)`} />

      <g fill="none" filter={`url(#${id})`}>
        {paths.map((path, index) => (
          <path
            key={index}
            d={path}
            stroke={layers[index].color}
            strokeWidth={index % 3 === 0 ? 5 : 3}
            opacity={0.3 + (index % 3) * 0.12}
          />
        ))}
      </g>

      <path
        d="M0 1510 Q270 1430 540 1510 T1080 1510"
        stroke={CYAN}
        strokeWidth="2"
        fill="none"
        opacity="0.16"
      />
    </svg>
  );
};

export const GeometryBackground = ({ seed }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const random = createRandom(seed);
  const rotationOffset = random() * 360;
  const sizeOffset = 0.88 + random() * 0.18;

  const pulse = spring({
    frame,
    fps,
    config: {
      damping: 24,
      stiffness: 32,
      mass: 1.8
    }
  });

  const rotation = rotationOffset + frame * 0.12;
  const reverseRotation = -rotationOffset * 0.5 - frame * 0.08;
  const scale = sizeOffset + interpolate(
    pulse,
    [0, 1],
    [0.025, 0.12],
    clamp
  );

  const id = `geometry-${seed}`;

  return (
    <svg viewBox="0 0 1080 1920" width="1080" height="1920">
      <GlowDefs id={id} />
      <rect width="1080" height="1920" fill={NAVY} />
      <circle cx="540" cy="960" r="700" fill={`url(#${id}-background)`} />

      <g transform={`translate(540 960) rotate(${rotation}) scale(${scale + 0.9})`}>
        <circle
          r="340"
          fill="none"
          stroke={CYAN}
          strokeWidth="4"
          strokeDasharray="16 22"
          opacity="0.42"
        />
        <polygon
          points="0,-300 260,-150 260,150 0,300 -260,150 -260,-150"
          fill="none"
          stroke={PURPLE}
          strokeWidth="8"
          opacity="0.7"
        />
        <polygon
          points="0,-205 178,102 -178,102"
          fill="rgba(57,139,255,0.07)"
          stroke={BLUE}
          strokeWidth="5"
        />
        <circle r="92" fill="none" stroke={GOLD} strokeWidth="5" opacity="0.55" />
      </g>

      <g transform={`translate(540 960) rotate(${reverseRotation}) scale(0.82)`}>
        <rect
          x="-390"
          y="-390"
          width="780"
          height="780"
          rx="90"
          fill="none"
          stroke={BLUE}
          strokeWidth="3"
          opacity="0.22"
        />
        <polygon
          points="0,-475 410,0 0,475 -410,0"
          fill="none"
          stroke={CYAN}
          strokeWidth="3"
          opacity="0.3"
        />
      </g>

      <circle
        cx="540"
        cy="960"
        r={190 + Math.sin(frame * 0.025) * 18}
        fill="none"
        stroke={GOLD}
        strokeWidth="2"
        opacity="0.23"
      />
    </svg>
  );
};

const VISUAL_STYLES = [
  "neural",
  "particles",
  "waves",
  "geometry"
];

export const VisualBackground = ({
  visual,
  videoId,
  sceneIndex
}) => {
  const videoSeed = hashSeed(videoId || "zehn-khan");
  const style = visual || VISUAL_STYLES[
    (videoSeed + sceneIndex) % VISUAL_STYLES.length
  ];
  const seed = hashSeed(`${videoId}:${sceneIndex}:${style}`);

  let background;

  switch (style) {
    case "neural":
      background = <NeuralBackground seed={seed} />;
      break;
    case "particles":
      background = <ParticlesBackground seed={seed} />;
      break;
    case "waves":
      background = <WavesBackground seed={seed} />;
      break;
    case "geometry":
      background = <GeometryBackground seed={seed} />;
      break;
    default:
      background = <NeuralBackground seed={seed} />;
  }

  return (
    <AbsoluteFill style={{ backgroundColor: NAVY }}>
      {background}
      <AbsoluteFill
        style={{
          background:
            "linear-gradient(180deg, rgba(8,13,32,0.22), rgba(8,13,32,0.46))"
        }}
      />
    </AbsoluteFill>
  );
};
