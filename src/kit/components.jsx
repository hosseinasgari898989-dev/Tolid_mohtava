import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { Activity, Atom, Brain, CalendarDays, CheckCircle2, Clock3, Globe2, HeartPulse, MapPin, Search, Sparkles } from "lucide-react";
import { DESIGN_TOKENS } from "../../design/tokens.js";
import { fitFontSize, fitTextStyle, toPersianDigits } from "./layout-utils.js";

const C = DESIGN_TOKENS.colors;
const FONT = DESIGN_TOKENS.fonts.persian;
const asDisplayText = (value) => {
  const text = String(value ?? "");
  const hasPersian = Array.from(text).some((character) => { const point = character.codePointAt(0); return point >= 0x0600 && point <= 0x06FF; });
  return hasPersian ? toPersianDigits(text) : text;
};
const baseText = { fontFamily: FONT, direction: "rtl", textAlign: "center", color: C.text };
const popIn = (frame, fps, delay = 0) => spring({ frame: Math.max(0, frame - delay), fps, config: DESIGN_TOKENS.motion.spring });
const glass = {
  boxSizing: "border-box",
  background: "linear-gradient(145deg, rgba(24,39,76,.88), rgba(12,22,47,.82))",
  border: "1px solid " + C.border,
  borderRadius: DESIGN_TOKENS.radius.card,
  boxShadow: "0 24px 70px rgba(0,0,0,.26), inset 0 1px 0 rgba(255,255,255,.08)"
};
const ICONS = {
  brain: Brain, activity: Activity, clock: Clock3, globe: Globe2, heart: HeartPulse,
  map: MapPin, search: Search, sparkles: Sparkles, atom: Atom, calendar: CalendarDays, check: CheckCircle2
};

export const IconBadge = ({ icon = "brain", label = "", accent = C.blue, size = 92, frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const progress = popIn(frame, fps);
  const Icon = typeof icon === "string" ? (ICONS[icon] || Sparkles) : (icon || Sparkles);
  return (
    <div style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12, opacity: progress, transform: "translateY(" + ((1 - progress) * 24) + "px) scale(" + (0.88 + progress * 0.12) + ")" }}>
      <div style={{ width: size, height: size, borderRadius: 26, display: "grid", placeItems: "center", color: accent, background: "linear-gradient(145deg, rgba(85,184,255,.19), rgba(167,139,250,.13))", border: "1px solid rgba(142,185,255,.34)", boxShadow: "0 0 38px " + accent + "33, inset 0 1px 0 rgba(255,255,255,.16)" }}>
        <Icon size={Math.round(size * 0.52)} strokeWidth={1.85} />
      </div>
      {label ? <span style={{ ...baseText, color: C.muted, fontSize: 27, fontWeight: 700 }}>{asDisplayText(label)}</span> : null}
    </div>
  );
};

export const KineticHeadline = ({ text, accentWord = "", fontSize = 78, maxWidth = 870, frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const words = asDisplayText(text).trim().split(/\s+/u).filter(Boolean);
  const fitted = fitFontSize(text, { width: maxWidth, fontSize, minFontSize: 38, maxLines: 3 });
  return (
    <div dir="rtl" style={{ ...baseText, maxWidth, width: "100%", margin: "0 auto", display: "flex", flexWrap: "wrap", justifyContent: "center", alignItems: "center", columnGap: 18, rowGap: 5, fontSize: fitted, lineHeight: 1.3, fontWeight: 900, textShadow: "0 0 28px rgba(85,184,255,.32), 0 8px 24px rgba(0,0,0,.68)" }}>
      {words.map((word, index) => {
        const progress = popIn(frame, fps, index * DESIGN_TOKENS.motion.stagger);
        const highlighted = accentWord && word.replace(/[،.!؟:؛]/gu, "") === accentWord.replace(/[،.!؟:؛]/gu, "");
        return <span key={String(index) + "-" + word} style={{ display: "inline-block", opacity: 1, transform: "translateY(" + ((1 - progress) * 18) + "px) scale(" + (0.92 + progress * 0.08) + ")", color: highlighted ? C.gold : C.text, textShadow: highlighted ? "0 0 12px rgba(255,224,130,.9), 0 0 34px rgba(255,224,130,.42)" : "0 4px 20px rgba(0,0,0,.7)" }}>{word}</span>;
      })}
    </div>
  );
};

export const StepHeader = ({ step = "01", label = "نکته", title = "", accentWord = "", icon = "sparkles", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const progress = popIn(frame, fps);
  return (
    <div style={{ position: "relative", width: "100%", display: "flex", flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 18, padding: "8px 4px 24px", opacity: progress, transform: "translateY(" + ((1 - progress) * 22) + "px)" }}>
      <div style={{ position: "absolute", top: -62, right: 10, fontFamily: FONT, fontSize: 232, fontWeight: 900, lineHeight: 1, color: "transparent", WebkitTextStroke: "2px rgba(114,165,255,.18)", zIndex: 0 }}>{toPersianDigits(step)}</div>
      <div style={{ position: "relative", zIndex: 1, flex: 1, textAlign: "right" }}>
        <div style={{ ...baseText, textAlign: "right", color: C.cyan, fontSize: 28, fontWeight: 800, letterSpacing: 1 }}>{asDisplayText(label)}</div>
        <KineticHeadline text={title} accentWord={accentWord} fontSize={62} maxWidth={760} frameOverride={frame} />
      </div>
      <IconBadge icon={icon} accent={C.gold} size={94} frameOverride={frame} />
    </div>
  );
};

export const BigNumber = ({ value = 2, unit = "", label = "", prefix = "", suffix = "", accent = C.gold, frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const progress = popIn(frame, fps, 3);
  const numeric = Number(value);
  const shown = Number.isFinite(numeric) ? toPersianDigits(Math.round(interpolate(progress, [0, 1], [0, numeric]))) : String(value);
  return (
    <div style={{ ...glass, padding: "34px 42px", textAlign: "center", transform: "scale(" + (0.94 + progress * 0.06) + ")", opacity: progress }}>
      <div style={{ ...baseText, color: C.muted, fontSize: 29, fontWeight: 700 }}>{asDisplayText(label)}</div>
      <div style={{ ...baseText, color: accent, fontSize: 150, fontWeight: 900, lineHeight: 1.1, textShadow: "0 0 30px " + accent + "55" }}>{asDisplayText(prefix)}{shown}<span style={{ fontSize: 52, marginRight: 12 }}>{asDisplayText(unit)}{asDisplayText(suffix)}</span></div>
    </div>
  );
};

export const BarChart = ({ data = [], title = "", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const max = Math.max(1, ...data.map((item) => Number(item.value) || 0));
  return (
    <div style={{ ...glass, padding: "32px 38px", width: "100%" }}>
      {title ? <div style={{ ...baseText, fontSize: 34, fontWeight: 800, marginBottom: 22 }}>{asDisplayText(title)}</div> : null}
      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
        {data.map((item, index) => {
          const progress = popIn(frame, fps, index * 6);
          const width = Math.max(4, ((Number(item.value) || 0) / max) * 100) * progress;
          return (
            <div key={String(index) + "-" + item.label}>
              <div style={{ ...baseText, display: "flex", justifyContent: "space-between", fontSize: 26, fontWeight: 700, marginBottom: 8 }}>
                <span>{asDisplayText(item.label)}</span><span style={{ color: C.gold }}>{item.displayValue !== undefined ? asDisplayText(item.displayValue) : toPersianDigits(item.value)}</span>
              </div>
              <div style={{ height: 20, background: "rgba(255,255,255,.1)", borderRadius: 99, overflow: "hidden", direction: "ltr" }}>
                <div style={{ height: "100%", width: width + "%", borderRadius: 99, background: item.color || "linear-gradient(90deg, " + C.blue + ", " + C.purple + ")", boxShadow: "0 0 24px rgba(85,184,255,.42)" }} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const LineChart = ({ data = [], title = "", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const progress = popIn(frame, fps, 2);
  const safe = data.length > 1 ? data : [{ value: 20 }, { value: 70 }, { value: 45 }, { value: 85 }];
  const values = safe.map((item) => Number(item.value) || 0);
  const low = Math.min(...values);
  const high = Math.max(...values, low + 1);
  const points = values.map((value, index) => {
    const x = 45 + (index / Math.max(1, values.length - 1)) * 690;
    const y = 270 - ((value - low) / (high - low)) * 210;
    return x + "," + y;
  }).join(" ");
  const dash = interpolate(progress, [0, 1], [820, 0]);
  return (
    <div style={{ ...glass, padding: "28px 34px", width: "100%" }}>
      {title ? <div style={{ ...baseText, fontSize: 32, fontWeight: 800 }}>{asDisplayText(title)}</div> : null}
      <svg viewBox="0 0 780 330" width="100%" height="270" role="img" aria-label={title || "نمودار خطی"}>
        {[70, 140, 210, 280].map((y) => <line key={y} x1="35" y1={y} x2="745" y2={y} stroke="rgba(151,180,255,.15)" strokeWidth="2" />)}
        <polyline points={points} fill="none" stroke={C.cyan} strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="820" strokeDashoffset={dash} />
        {safe.map((item, index) => {
          const x = 45 + (index / Math.max(1, safe.length - 1)) * 690;
          const y = 270 - ((values[index] - low) / (high - low)) * 210;
          return <circle key={index} cx={x} cy={y} r="11" fill={C.gold} stroke={C.navySoft} strokeWidth="5" opacity={progress} />;
        })}
      </svg>
    </div>
  );
};

export const DonutChart = ({ value = 68, total = 100, label = "", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const progress = popIn(frame, fps, 5);
  const radius = 112;
  const circumference = 2 * Math.PI * radius;
  const ratio = Math.max(0, Math.min(1, Number(value) / Math.max(1, Number(total))));
  const offset = circumference * (1 - ratio * progress);
  return (
    <div style={{ ...glass, padding: "26px 30px", display: "flex", alignItems: "center", justifyContent: "center", gap: 24 }}>
      <svg viewBox="0 0 280 280" width="250" height="250">
        <circle cx="140" cy="140" r={radius} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="24" />
        <circle cx="140" cy="140" r={radius} fill="none" stroke={C.purple} strokeWidth="24" strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset} transform="rotate(-90 140 140)" />
        <text x="140" y="154" textAnchor="middle" fill={C.text} fontSize="46" fontFamily={FONT} fontWeight="800">{toPersianDigits(Math.round(ratio * 100))}٪</text>
      </svg>
      {label ? <div style={{ ...baseText, color: C.muted, fontSize: 30, fontWeight: 800 }}>{asDisplayText(label)}</div> : null}
    </div>
  );
};

export const ComparisonBars = ({ a = {}, b = {}, title = "", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  return (
    <div style={{ ...glass, padding: "30px 34px", display: "flex", flexDirection: "column", gap: 22 }}>
      {title ? <div style={{ ...baseText, fontSize: 33, fontWeight: 850 }}>{asDisplayText(title)}</div> : null}
      <div style={{ display: "flex", gap: 18, direction: "rtl" }}>
        {[a, b].map((item, index) => {
          const p = popIn(frame, fps, index * 7);
          return (
          <div key={index} style={{ flex: 1, minHeight: 170, padding: 20, borderRadius: 22, background: index === 0 ? "rgba(85,184,255,.1)" : "rgba(167,139,250,.12)", border: "1px solid " + C.border, opacity: p, transform: "translateY(" + ((1 - p) * 18) + "px)" }}>
            <div style={{ ...baseText, fontSize: 32, fontWeight: 900, color: index === 0 ? C.cyan : C.gold }}>{asDisplayText(item.label || (index === 0 ? "گزینه A" : "گزینه B"))}</div>
            {item.value !== undefined ? <div style={{ marginTop: 16, height: 15, borderRadius: 99, background: "rgba(255,255,255,.12)", overflow: "hidden", direction: "ltr" }}><div style={{ width: (Math.min(100, Math.max(0, Number(item.value))) * p) + "%", height: "100%", background: index === 0 ? C.blue : C.purple }} /></div> : null}
            {item.detail ? <div style={{ ...baseText, color: C.muted, fontSize: 25, marginTop: 14 }}>{asDisplayText(item.detail)}</div> : null}
          </div>
          );
        })}
      </div>
    </div>
  );
};

export const InfoCard = ({ title = "", body = "", icon = "sparkles", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const p = popIn(frame, fps, 4);
  const fit = fitTextStyle(body, { width: 750, fontSize: 34, minFontSize: 25, maxLines: 4 });
  return (
    <div style={{ ...glass, width: "100%", padding: "42px 46px", opacity: p, transform: "translateX(" + ((1 - p) * 60) + "px)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 20, marginBottom: 22 }}>
        <IconBadge icon={icon} size={76} frameOverride={frame} />
        <div style={{ ...baseText, fontSize: fitFontSize(title, { width: 650, fontSize: 45, minFontSize: 28 }), fontWeight: 900, color: C.gold }}>{asDisplayText(title)}</div>
      </div>
      <div style={{ ...baseText, ...fit, color: C.muted, margin: "0 auto", fontWeight: 600 }}>{asDisplayText(body)}</div>
    </div>
  );
};

export const Timeline = ({ events = [], title = "", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const safe = events.slice(0, 4);
  return (
    <div style={{ ...glass, padding: "32px 36px", width: "100%" }}>
      {title ? <div style={{ ...baseText, fontSize: 34, fontWeight: 900, marginBottom: 28 }}>{asDisplayText(title)}</div> : null}
      <div style={{ position: "relative", display: "flex", flexDirection: "column", gap: 22 }}>
        <div style={{ position: "absolute", top: 16, bottom: 14, right: 17, width: 4, background: "linear-gradient(" + C.cyan + ", " + C.purple + ")", opacity: 0.8 }} />
        {safe.map((event, index) => {
          const p = popIn(frame, fps, index * 8);
          return (
            <div key={index} style={{ display: "flex", alignItems: "flex-start", gap: 22, opacity: p, transform: "translateX(" + ((1 - p) * 26) + "px)" }}>
              <div style={{ width: 38, height: 38, borderRadius: 99, background: index === 0 ? C.gold : C.blue, boxShadow: "0 0 22px rgba(85,184,255,.34)", flexShrink: 0, zIndex: 1 }} />
              <div style={{ textAlign: "right", flex: 1 }}>
                <div style={{ ...baseText, color: C.cyan, fontSize: 24, fontWeight: 800 }}>{asDisplayText(event.when || "")}</div>
                <div style={{ ...baseText, fontSize: 31, fontWeight: 900 }}>{asDisplayText(event.title || "")}</div>
                {event.description ? <div style={{ ...baseText, color: C.muted, fontSize: 24, marginTop: 4 }}>{asDisplayText(event.description)}</div> : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export const Chips = ({ items = [], accent = C.cyan, frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  return (
    <div dir="rtl" style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 15, width: "100%" }}>
      {items.map((item, index) => {
        const p = popIn(frame, fps, index * 5);
        const text = asDisplayText(typeof item === "string" ? item : item.label);
        return <div key={index} style={{ ...baseText, padding: "15px 26px", borderRadius: 999, background: "rgba(85,184,255,.11)", border: "1px solid " + accent + "55", color: accent, fontSize: 26, fontWeight: 800, opacity: p, transform: "translateY(" + ((1 - p) * 16) + "px) scale(" + (0.94 + p * 0.06) + ")" }}>{text}</div>;
      })}
    </div>
  );
};
export const Tags = Chips;

export const SearchBar = ({ query = "راز شگفت‌انگیز بدن انسان", placeholder = "جست‌وجو کن", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const p = popIn(frame, fps, 2);
  const visible = Math.max(0, Math.min(query.length, Math.floor(frame / 2)));
  const typed = asDisplayText(query).slice(0, visible);
  return (
    <div style={{ ...glass, padding: 22, width: "100%", display: "flex", alignItems: "center", gap: 18, opacity: p, transform: "translateY(" + ((1 - p) * 20) + "px)" }}>
      <div style={{ flex: 1, borderRadius: 18, padding: "18px 22px", background: "rgba(255,255,255,.06)", border: "1px solid rgba(149,177,255,.18)", display: "flex", alignItems: "center", gap: 12 }}>
        <Search size={34} color={C.cyan} />
        <span style={{ ...baseText, fontSize: 27, textAlign: "right", flex: 1, color: typed ? C.text : C.muted }}>{typed || asDisplayText(placeholder)}<span style={{ color: C.gold, opacity: frame % 20 < 10 ? 1 : 0 }}>▍</span></span>
      </div>
      <IconBadge icon="search" size={68} frameOverride={frame} />
    </div>
  );
};

export const MapPinDrop = ({ label = "موقعیت روی نقشه", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const p = popIn(frame, fps, 4);
  return (
    <div style={{ ...glass, padding: "32px 40px", display: "flex", alignItems: "center", justifyContent: "center", gap: 26, width: "100%" }}>
      <div style={{ color: C.gold, opacity: p, transform: "translateY(" + ((1 - p) * -46) + "px) scale(" + (0.9 + p * 0.1) + ")" }}><MapPin size={104} strokeWidth={1.7} fill="rgba(255,224,130,.10)" /></div>
      <div style={{ ...baseText, textAlign: "right", fontSize: 32, fontWeight: 800 }}>{asDisplayText(label)}</div>
    </div>
  );
};

export const OrbitDiagram = ({ label = "مدار سیاره", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const p = popIn(frame, fps, 3);
  const angle = frame * 0.035;
  return (
    <div style={{ ...glass, padding: "25px 28px", width: "100%", textAlign: "center" }}>
      <svg viewBox="0 0 760 420" width="100%" height="310">
        <ellipse cx="380" cy="210" rx="270" ry="125" fill="none" stroke="rgba(85,184,255,.36)" strokeWidth="3" transform="rotate(-14 380 210)" />
        <ellipse cx="380" cy="210" rx="205" ry="90" fill="none" stroke="rgba(167,139,250,.34)" strokeWidth="2" transform="rotate(18 380 210)" />
        <circle cx="380" cy="210" r="48" fill={C.gold} opacity={p} />
        <circle cx="380" cy="210" r="72" fill="none" stroke="rgba(255,224,130,.16)" strokeWidth="12" />
        <circle cx={380 + Math.cos(angle) * 270} cy={210 + Math.sin(angle) * 125} r="22" fill={C.cyan} />
        <circle cx={380 + Math.cos(angle * -0.7 + 2) * 205} cy={210 + Math.sin(angle * -0.7 + 2) * 90} r="14" fill={C.purple} />
      </svg>
      <div style={{ ...baseText, color: C.muted, fontSize: 30, fontWeight: 800 }}>{asDisplayText(label)}</div>
    </div>
  );
};

export const OrganPulse = ({ label = "ضربان قلب", detail = "نبض پیوسته", frameOverride }) => {
  const localFrame = useCurrentFrame();
  const frame = frameOverride ?? localFrame;
  const { fps } = useVideoConfig();
  const p = popIn(frame, fps, 2);
  const pulse = 0.97 + Math.max(0, Math.sin(frame * 0.18)) * 0.08;
  return (
    <div style={{ ...glass, padding: "34px 42px", display: "flex", alignItems: "center", justifyContent: "center", gap: 28, width: "100%" }}>
      <div style={{ color: "#FF829A", transform: "scale(" + pulse + ")", opacity: p, filter: "drop-shadow(0 0 22px rgba(255,100,145,.48))" }}><HeartPulse size={122} strokeWidth={1.6} /></div>
      <div style={{ textAlign: "right" }}>
        <div style={{ ...baseText, fontSize: 36, fontWeight: 900 }}>{asDisplayText(label)}</div>
        <div style={{ ...baseText, color: C.muted, fontSize: 26, marginTop: 7 }}>{asDisplayText(detail)}</div>
      </div>
    </div>
  );
};

export const LayoutRenderer = ({ layout = "headline", data = {}, fallbackText = "", accentWord = "", frameOverride }) => {
  const text = data.text || data.title || fallbackText;
  switch (layout) {
    case "bignumber":
      return <BigNumber value={data.value ?? 2} unit={data.unit || ""} label={data.label || text} frameOverride={frameOverride} />;
    case "chart":
      if (data.chartType === "line") return <LineChart data={data.values || []} title={data.title || text} frameOverride={frameOverride} />;
      if (data.chartType === "donut") return <DonutChart value={data.value ?? 68} total={data.total ?? 100} label={data.title || text} frameOverride={frameOverride} />;
      return <BarChart data={data.values || []} title={data.title || text} frameOverride={frameOverride} />;
    case "timeline":
      return <Timeline events={data.events || []} title={data.title || text} frameOverride={frameOverride} />;
    case "comparison":
      return <ComparisonBars a={data.a || { label: "گزینه A" }} b={data.b || { label: "گزینه B" }} title={data.title || text} frameOverride={frameOverride} />;
    case "card":
      return <InfoCard title={data.title || text} body={data.body || ""} icon={data.icon || "sparkles"} frameOverride={frameOverride} />;
    case "list":
      return <div style={{ ...glass, padding: "35px 40px", width: "100%" }}><div style={{ ...baseText, color: C.gold, fontSize: 38, fontWeight: 900, marginBottom: 24 }}>{asDisplayText(data.title || text)}</div><Chips items={data.items || [fallbackText]} frameOverride={frameOverride} /></div>;
    case "headline":
    default:
      return <KineticHeadline text={text} accentWord={data.accentWord || accentWord} frameOverride={frameOverride} />;
  }
};
