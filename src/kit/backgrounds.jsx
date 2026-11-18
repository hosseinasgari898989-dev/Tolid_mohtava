import React from "react";
import { AbsoluteFill, useCurrentFrame } from "remotion";
import { DESIGN_TOKENS } from "../../design/tokens.js";

export const KitBackground = ({ variant = "grid", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { colors } = DESIGN_TOKENS;
  const driftX = Math.sin(frame / 44) * 28;
  const driftY = Math.cos(frame / 53) * 34;
  const gridOpacity = variant === "plain" ? 0.08 : 0.2;
  return (
    <AbsoluteFill style={{ backgroundColor: colors.navy, overflow: "hidden" }}>
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 22% 18%, rgba(75,151,255,.22), transparent 42%), radial-gradient(ellipse at 82% 72%, rgba(160,111,255,.18), transparent 42%), linear-gradient(155deg, #080D20 5%, #101A35 58%, #080D20 100%)" }} />
      <div style={{ position: "absolute", inset: -80, opacity: gridOpacity, backgroundImage: "linear-gradient(rgba(130,170,255,.25) 1px, transparent 1px), linear-gradient(90deg, rgba(130,170,255,.25) 1px, transparent 1px)", backgroundSize: "72px 72px", transform: "translate(" + (driftX * 0.25) + "px," + (driftY * 0.2) + "px)" }} />
      <div style={{ position: "absolute", width: 560, height: 560, borderRadius: "50%", top: -170 + driftY, left: -160 + driftX, background: "radial-gradient(circle, rgba(77,181,255,.27), rgba(77,181,255,0) 70%)", filter: "blur(10px)" }} />
      <div style={{ position: "absolute", width: 640, height: 640, borderRadius: "50%", bottom: -250 - driftY, right: -210 - driftX, background: "radial-gradient(circle, rgba(165,117,255,.23), rgba(165,117,255,0) 68%)", filter: "blur(12px)" }} />
      <svg viewBox="0 0 1080 1920" width="100%" height="100%" style={{ position: "absolute", inset: 0, opacity: 0.26 }}>
        <circle cx="870" cy="330" r="7" fill={colors.cyan} />
        <circle cx="170" cy="1280" r="6" fill={colors.gold} />
        <circle cx="890" cy="1430" r="4" fill={colors.purple} />
        <path d="M80 420 H290 M790 1130 H1000 M150 1510 H320" stroke="rgba(135,177,255,.34)" strokeWidth="2" />
        <path d="M850 240 L890 280 L930 240" fill="none" stroke="rgba(255,224,130,.34)" strokeWidth="3" />
      </svg>
      <div style={{ position: "absolute", inset: 0, opacity: 0.13, backgroundImage: "radial-gradient(rgba(255,255,255,.26) .7px, transparent .7px)", backgroundSize: "5px 5px", mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at center, transparent 45%, rgba(2,5,15,.76) 100%)", pointerEvents: "none" }} />
    </AbsoluteFill>
  );
};
export const BackgroundPack = KitBackground;
