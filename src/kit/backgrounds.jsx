import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DESIGN_TOKENS } from "../../design/tokens.js";

export const KitBackground = ({ variant = "grid", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { colors } = DESIGN_TOKENS;
  const driftX = Math.sin(frame / 44) * 30;
  const driftY = Math.cos(frame / 53) * 34;
  const gridOpacity = variant === "plain" ? 0.19 : 0.30;
  const orbitRotation = frame * 0.035;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 42%, rgba(61,125,255,.19), transparent 48%), linear-gradient(155deg, #080D20 3%, #101A35 55%, #080D20 100%)" }} />
      <div style={{ position: "absolute", inset: -80, opacity: gridOpacity, backgroundImage: "linear-gradient(rgba(145,184,255,.34) 1px, transparent 1px), linear-gradient(90deg, rgba(145,184,255,.34) 1px, transparent 1px)", backgroundSize: "64px 64px", transform: "translate(" + (driftX * 0.25) + "px," + (driftY * 0.2) + "px)" }} />
      <div style={{ position: "absolute", width: 620, height: 620, borderRadius: "50%", top: -190 + driftY, left: -170 + driftX, background: "radial-gradient(circle, rgba(77,181,255,.34), rgba(77,181,255,0) 70%)", filter: "blur(12px)" }} />
      <div style={{ position: "absolute", width: 700, height: 700, borderRadius: "50%", top: "30%", right: -300 - driftX, background: "radial-gradient(circle, rgba(165,117,255,.29), rgba(165,117,255,0) 68%)", filter: "blur(14px)" }} />
      <div style={{ position: "absolute", width: 560, height: 560, borderRadius: "50%", bottom: -240 - driftY, left: "18%", background: "radial-gradient(circle, rgba(65,221,237,.22), rgba(65,221,237,0) 68%)", filter: "blur(12px)" }} />
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.42 }}>
        <g fill="none" strokeLinecap="round">
          <circle cx="870" cy="330" r="7" fill={colors.cyan} stroke="none" />
          <circle cx="170" cy="1280" r="6" fill={colors.gold} stroke="none" />
          <circle cx="890" cy="1430" r="5" fill={colors.purple} stroke="none" />
          <path d="M80 420 H330 M730 1130 H1000 M150 1510 H420" stroke="rgba(135,177,255,.52)" strokeWidth="3" />
          <path d="M850 240 L910 300 L970 240" stroke="rgba(255,224,130,.50)" strokeWidth="4" />
          <path d="M190 740 L250 800 L190 860 L130 800 Z" stroke="rgba(102,228,245,.48)" strokeWidth="3" transform={"rotate(" + orbitRotation + " 190 800)"} />
          <circle cx="830" cy="1580" r="76" stroke="rgba(167,139,250,.42)" strokeWidth="3" />
          <circle cx="830" cy="1580" r="126" stroke="rgba(102,228,245,.28)" strokeWidth="2" strokeDasharray="8 17" />
        </g>
        <g fill="none" stroke="rgba(255,255,255,.22)" strokeWidth="2">
          <path d="M70 1040 l28 -48 l28 48 Z" />
          <path d="M920 760 l30 -30 l30 30 l-30 30 Z" />
          <path d="M430 1680 h80 m-40 -40 v80" />
        </g>
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: 0.11, backgroundImage: "radial-gradient(rgba(255,255,255,.34) .7px, transparent .7px)", backgroundSize: "5px 5px", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(2,5,15,.62) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
export const BackgroundPack = KitBackground;
