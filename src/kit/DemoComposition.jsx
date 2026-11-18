import React from "react";
import { AbsoluteFill } from "remotion";
import { TransitionSeries } from "@remotion/transitions";
import "@fontsource/vazirmatn/400.css";
import "@fontsource/vazirmatn/700.css";
import "@fontsource/vazirmatn/900.css";
import { DESIGN_TOKENS } from "../../design/tokens.js";
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
      position: "absolute", inset: 0, padding: "68px 72px",
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      gap: 26, fontFamily: DESIGN_TOKENS.fonts.persian
    }}>
      <StepHeader step={section} label={label} title={title} accentWord={title.split(" ")[0]} icon="sparkles" />
      <div style={{ display: "flex", flexDirection: "column", gap: 26, justifyContent: "center", flex: 1 }}>
        {children}
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", color: "rgba(198,211,244,.58)", fontSize: 22, fontWeight: 700 }}>
        <span>ذهن‌خوان</span><span>MOTION KIT V1 · داده‌های فرضی</span>
      </div>
    </div>
  </AbsoluteFill>
);

export const KitDemo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={120}>
      <DemoFrame section="01" label="حرکت متن" title="یک عدد، یک داستان">
        <KineticHeadline text="هر حقیقت، یک تصویر روشن" accentWord="حقیقت" fontSize={76} />
        <BigNumber value={12} unit="٪" label="عدد فرضی برای تست شمارنده" />
      </DemoFrame>
    </TransitionSeries.Sequence>
    {makeSceneTransition("slide", 18)}
    <TransitionSeries.Sequence durationInFrames={120}>
      <DemoFrame section="02" label="داده‌نمایی" title="داده را ساده ببین">
        <BarChart title="اعداد فرضی برای تست نمودار" data={[{ label: "گروه اول", value: 82 }, { label: "گروه دوم", value: 54 }, { label: "گروه سوم", value: 36 }]} />
        <LineChart title="روند ساختگی برای تست" data={[{ value: 22 }, { value: 44 }, { value: 34 }, { value: 74 }, { value: 88 }]} />
        <DonutChart value={68} total={100} label="درصد فرضی برای تست" />
      </DemoFrame>
    </TransitionSeries.Sequence>
    {makeSceneTransition("wipe", 18)}
    <TransitionSeries.Sequence durationInFrames={120}>
      <DemoFrame section="03" label="روایت تصویری" title="زمان را کنار هم بچین">
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
      <DemoFrame section="04" label="جست‌وجو و برچسب" title="جزئیات را مرتب کن" variant="glow">
        <SearchBar query="چرا آسمان آبی است؟" />
        <Chips items={["فضا", "طبیعت", "بدن انسان", "تاریخ", "حیوانات"]} />
      </DemoFrame>
    </TransitionSeries.Sequence>
    {makeSceneTransition("slide", 18)}
    <TransitionSeries.Sequence durationInFrames={120}>
      <DemoFrame section="05" label="آیکون و مکان" title="نشانه‌ها سریع دیده شوند" variant="plain">
        <div style={{ display: "flex", justifyContent: "space-around", alignItems: "center" }}>
          <IconBadge icon="brain" label="مغز" />
          <IconBadge icon="globe" label="زمین" accent={colors.purple} />
          <IconBadge icon="calendar" label="زمان" accent={colors.gold} />
        </div>
        <MapPinDrop label="نقطه‌ای روی نقشه" />
      </DemoFrame>
    </TransitionSeries.Sequence>
    {makeSceneTransition("zoom", 18)}
    <TransitionSeries.Sequence durationInFrames={120}>
      <DemoFrame section="06" label="نمودارهای علمی" title="حرکت را زنده کن">
        <OrbitDiagram label="مدار سیاره‌ها" />
        <OrganPulse label="قلب" detail="ضربان تصویری" />
        <ComparisonBars title="دو ایده کنار هم" a={{ label: "پرسش", detail: "کنجکاوی" }} b={{ label: "پاسخ", detail: "فهم بهتر" }} />
      </DemoFrame>
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
