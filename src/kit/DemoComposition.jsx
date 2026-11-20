import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";
import { DESIGN_TOKENS } from "../../design/tokens.js";
import { KEY_CONTENT_AREA } from "./layout-utils.js";
import { KitBackground } from "./backgrounds.jsx";
import {
  BarChart, BigNumber, Chips, ComparisonBars, DonutChart, IconBadge,
  InfoCard, KineticHeadline, LineChart, MapPinDrop, OrganPulse, OrbitDiagram,
  SearchBar, StepHeader, Timeline
} from "./components.jsx";
import { makeSceneTransition } from "./transitions.jsx";

const colors = DESIGN_TOKENS.colors;
const DemoFrame = ({ section, label, title, variant = "grid", children }) => (
  <AbsoluteFill style={{ backgroundColor: colors.navy, overflow: "hidden" }}>
    <KitBackground variant={variant} />
    <div style={{
      position: "absolute", top: "12%", left: 60, right: 60, height: "18%",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: DESIGN_TOKENS.fonts.persian
    }}>
      <StepHeader step={section} label={label} title={title} accentWord={title.split(" ")[0]} icon="sparkles" />
    </div>
    <div style={{
      position: "absolute", top: `${KEY_CONTENT_AREA.top}%`, left: 64, right: 64, height: `${KEY_CONTENT_AREA.height}%`,
      display: "flex", flexDirection: "column", alignItems: "stretch",
      justifyContent: "center", gap: 22, maxWidth: 952, margin: "0 auto",
      fontFamily: DESIGN_TOKENS.fonts.persian
    }}>
      {children}
    </div>
    <div style={{
      position: "absolute", left: 64, right: 64, bottom: "3%",
      display: "flex", justifyContent: "space-between", alignItems: "center",
      color: "rgba(198,211,244,.70)", fontSize: 22, fontWeight: 700,
      fontFamily: DESIGN_TOKENS.fonts.persian
    }}>
      <span>ذهن‌خوان</span><span>MOTION KIT V1 · داده‌های فرضی</span>
    </div>
  </AbsoluteFill>
);

export const KitDemo = () => (
  <AbsoluteFill style={{ backgroundColor: colors.navy, overflow: "hidden" }}>
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={120}>
        <DemoFrame section="۰۱" label="حرکت متن" title="یک عدد، یک داستان">
          <KineticHeadline text="هر حقیقت، یک تصویر روشن" accentWord="حقیقت" fontSize={108} />
          <BigNumber value={12} unit="٪" label="عدد نمونه برای نمایش شمارنده" />
        </DemoFrame>
      </TransitionSeries.Sequence>
      {makeSceneTransition("slide", 18)}
      <TransitionSeries.Sequence durationInFrames={120}>
        <DemoFrame section="۰۲" label="داده‌نمایی" title="داده را ساده ببین">
          <BarChart title="مقایسه سه مقدار نمونه" data={[{ label: "گروه اول", value: 82 }, { label: "گروه دوم", value: 54 }, { label: "گروه سوم", value: 36 }]} />
          <LineChart title="روند نمونه" data={[{ value: 22 }, { value: 44 }, { value: 34 }, { value: 74 }, { value: 88 }]} />
        </DemoFrame>
      </TransitionSeries.Sequence>
      {makeSceneTransition("wipe", 18)}
      <TransitionSeries.Sequence durationInFrames={120}>
        <DemoFrame section="۰۳" label="روایت تصویری" title="زمان را کنار هم بچین">
          <InfoCard title="یک نکته مهم" body="اطلاعات کوتاه را در یک کارت شیشه‌ای و خوانا نمایش بده." icon="brain" />
          <Timeline title="خط زمان نمونه" events={[
            { when: "مرحله اول", title: "پرسش", description: "شروع روایت" },
            { when: "مرحله دوم", title: "کشف", description: "نمایش شاهد" },
            { when: "مرحله سوم", title: "نتیجه", description: "جمع‌بندی روشن" }
          ]} />
        </DemoFrame>
      </TransitionSeries.Sequence>
      {makeSceneTransition("zoom", 18)}
      <TransitionSeries.Sequence durationInFrames={120}>
        <DemoFrame section="۰۴" label="جست‌وجو و برچسب" title="جزئیات را مرتب کن" variant="glow">
          <SearchBar query="چرا آسمان آبی است؟" />
          <Chips items={["فضا", "طبیعت", "بدن انسان", "تاریخ", "حیوانات"]} />
        </DemoFrame>
      </TransitionSeries.Sequence>
      {makeSceneTransition("slide", 18)}
      <TransitionSeries.Sequence durationInFrames={120}>
        <DemoFrame section="۰۵" label="آیکون و مکان" title="نشانه‌ها سریع دیده شوند">
          <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
            <IconBadge icon="brain" label="مغز" />
            <IconBadge icon="globe" label="زمین" accent={colors.purple} />
            <IconBadge icon="calendar" label="زمان" accent={colors.gold} />
          </div>
          <MapPinDrop label="نقطه‌ای روی نقشه" />
        </DemoFrame>
      </TransitionSeries.Sequence>
      {makeSceneTransition("slide", 18)}
      <TransitionSeries.Sequence durationInFrames={120}>
        <DemoFrame section="۰۶" label="نمودارهای علمی" title="حرکت را زنده کن">
          <OrbitDiagram label="مدار سیاره‌ها" />
          <OrganPulse label="قلب" detail="ضربان تصویری" />
        </DemoFrame>
      </TransitionSeries.Sequence>
    </TransitionSeries>
  </AbsoluteFill>
);
