"use client";

import type { ChartSection } from "../../../types/infographic";
import { resolveIcon } from "../iconMap";
import { CHART_PALETTE, type Datum } from "./charts/chartUtils";
import { BubbleChart } from "./charts/BubbleChart";
import { RadialChart } from "./charts/RadialChart";
import { TrendAreaChart } from "./charts/TrendAreaChart";
import { HorizontalBarChart } from "./charts/HorizontalBarChart";
import { VerticalBarChart } from "./charts/VerticalBarChart";
import { DonutChart } from "./charts/DonutChart";

type Props = {
  section: ChartSection;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  bgColor: string;
  width: number;
  height: number;
  fill?: boolean;
};

export function ChartRegion({ section, primaryColor, secondaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const palette = [accentColor, ...CHART_PALETTE];
  const data: Datum[] = section.data.map((d, i) => ({
    name: d.label,
    value: Number(d.value) || 0,
    valueLabel: d.valueLabel,
    fill: palette[i % palette.length],
  }));

  // Center label must be short or it overlaps the ring. Prefer a short unit,
  // else the dominant segment's (short) valueLabel.
  const topValueLabel = data.length > 0
    ? data.reduce((a, b) => (b.value > a.value ? b : a)).valueLabel ?? undefined
    : undefined;
  const donutCenter = section.unit && section.unit.length <= 8
    ? section.unit
    : (topValueLabel && topValueLabel.length <= 8 ? topValueLabel : undefined);

  const HeadingIcon = resolveIcon(section.icon, section.heading);

  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" }
    : { width, height, backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" };

  return (
    <div style={rootStyle}>
      {section.imageUrl && (
        <div style={{ flex: "0 0 auto", height: 56, position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${bgColor} 100%)` }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: "10px 18px 12px", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", margin: "0 0 8px 0", opacity: 0.85, display: "flex", alignItems: "center", gap: 6, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flexShrink: 0 }}>
          {HeadingIcon && <HeadingIcon size={14} color={accentColor} strokeWidth={2.4} style={{ flexShrink: 0 }} aria-hidden />}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{section.heading}</span>
        </p>

        {section.chartType === "bubble"
          ? <BubbleChart data={data} />
          : section.chartType === "radial"
            ? <RadialChart data={data} primaryColor={primaryColor} />
            : section.chartType === "area"
              ? <TrendAreaChart data={data} primaryColor={primaryColor} accentColor={accentColor} />
              : section.chartType === "bar" && data.length > 4
                ? <HorizontalBarChart data={data} primaryColor={primaryColor} accentColor={accentColor} />
                : section.chartType === "bar"
                  ? <VerticalBarChart data={data} primaryColor={primaryColor} />
                  : <DonutChart data={data} primaryColor={primaryColor} bgColor={bgColor} isDonut={section.chartType === "donut"} centerLabel={donutCenter} />
        }

        {section.insight && (
          <p style={{ color: primaryColor, fontSize: 10, lineHeight: 1.35, marginTop: 6, opacity: 0.55, fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, flexShrink: 0 }}>
            {section.insight}
          </p>
        )}
      </div>
    </div>
  );
}
