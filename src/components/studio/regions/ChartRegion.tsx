"use client";

import { Cell, Legend, Pie, PieChart, ResponsiveContainer } from "recharts";
import type { ChartSection } from "../../../types/infographic";

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

const CHART_PALETTE = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#06b6d4", "#f43f5e", "#84cc16", "#f97316"];

function HorizontalBarChart({
  data, primaryColor, accentColor,
}: {
  data: { name: string; value: number; valueLabel?: string; fill: string }[];
  primaryColor: string;
  accentColor: string;
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", minHeight: 0 }}>
      {data.map((item, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ width: "30%", fontSize: 11, color: primaryColor, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flexShrink: 0, opacity: 0.8 }}>
            {item.name}
          </span>
          <div style={{ flex: 1, height: 10, backgroundColor: `${accentColor}20`, borderRadius: 10, overflow: "hidden", minWidth: 0 }}>
            <div style={{ width: `${(item.value / maxVal) * 100}%`, height: "100%", backgroundColor: item.fill, borderRadius: 10 }} />
          </div>
          <span style={{ width: "14%", fontSize: 11, color: accentColor, fontWeight: 800, textAlign: "right", flexShrink: 0 }}>
            {item.valueLabel ?? item.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function VerticalBarChart({
  data, primaryColor,
}: {
  data: { name: string; value: number; valueLabel?: string; fill: string }[];
  primaryColor: string;
}) {
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 4, minHeight: 0 }}>
      {data.map((item, i) => (
        <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end", minWidth: 0 }}>
          <span style={{ fontSize: 11, color: item.fill, fontWeight: 900, whiteSpace: "nowrap" }}>
            {item.valueLabel ?? item.value}
          </span>
          <div style={{ width: "60%", minWidth: 8, backgroundColor: item.fill, borderRadius: "3px 3px 0 0", height: `${Math.max(4, (item.value / maxVal) * 100)}%` }} />
          <span style={{ fontSize: 9, color: primaryColor, opacity: 0.65, textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width: "100%" }}>
            {item.name}
          </span>
        </div>
      ))}
    </div>
  );
}

function BubbleChart({
  data, primaryColor,
}: {
  data: { name: string; value: number; valueLabel?: string; fill: string }[];
  primaryColor: string;
}) {
  const max = Math.max(...data.map(d => d.value), 1);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 6, padding: "4px 0", minHeight: 0 }}>
      {sorted.map((item, i) => {
        const ratio = Math.sqrt(item.value / max);
        const size = Math.max(36, Math.round(ratio * 100));
        const fontSize = Math.max(8, Math.round(size * 0.17));
        return (
          <div key={i} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0 }}>
            <div style={{
              width: size, height: size, borderRadius: "50%",
              backgroundColor: item.fill,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <span style={{
                fontSize, fontWeight: 800, color: "#fff",
                textAlign: "center", padding: "0 4px", lineHeight: 1.2,
                overflow: "hidden", display: "-webkit-box",
                WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
              }}>
                {item.name}
              </span>
            </div>
            <span style={{ fontSize: 10, fontWeight: 900, color: item.fill }}>
              {item.valueLabel ?? item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function DonutChart({
  data, primaryColor, isDonut, centerLabel,
}: {
  data: { name: string; value: number; valueLabel?: string; fill: string }[];
  primaryColor: string;
  isDonut: boolean;
  centerLabel?: string;
}) {
  const innerRatio = isDonut ? 0.55 : 0;

  return (
    <div style={{ width: "100%", flex: 1, position: "relative", minHeight: 120 }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data} dataKey="value" nameKey="name"
            cx="38%" cy="50%"
            innerRadius={`${Math.round(innerRatio * 72)}%`}
            outerRadius="72%"
            paddingAngle={isDonut ? 3 : 0}
            startAngle={90} endAngle={-270}
          >
            {data.map((entry, i) => <Cell key={i} fill={entry.fill} stroke="none" />)}
          </Pie>
          <Legend
            layout="vertical" align="right" verticalAlign="middle"
            iconType="circle" iconSize={8}
            wrapperStyle={{ fontSize: 11, color: primaryColor, lineHeight: 1.7 }}
            formatter={(value) => (
              <span style={{ color: primaryColor, opacity: 0.8 }}>{value}</span>
            )}
          />
        </PieChart>
      </ResponsiveContainer>
      {isDonut && centerLabel && (
        <div style={{ position: "absolute", left: "40%", top: "50%", transform: "translate(-50%, -50%)", textAlign: "center", pointerEvents: "none" }}>
          <span style={{ fontSize: 13, fontWeight: 900, color: primaryColor, lineHeight: 1 }}>{centerLabel}</span>
        </div>
      )}
    </div>
  );
}

export function ChartRegion({ section, primaryColor, secondaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const palette = [accentColor, ...CHART_PALETTE];
  const data = section.data.map((d, i) => ({
    name: d.label,
    value: Number(d.value) || 0,
    valueLabel: d.valueLabel,
    fill: palette[i % palette.length],
  }));

  // Donut center: show unit if set, else top segment's valueLabel, else nothing
  const donutCenter = section.unit
    ? section.unit
    : data.length > 0
      ? (data.reduce((a, b) => (b.value > a.value ? b : a)).valueLabel ?? undefined)
      : undefined;

  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" }
    : { width, height,               backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" };

  return (
    <div style={rootStyle}>
      {section.imageUrl && (
        <div style={{ flex: "0 0 auto", height: 70, position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${bgColor} 100%)` }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: "12px 20px 14px", boxSizing: "border-box", display: "flex", flexDirection: "column", overflow: "hidden" }}>
        <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 8px 0", opacity: 0.8, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flexShrink: 0 }}>
          {section.heading}
        </p>

        {section.chartType === "bubble"
          ? <BubbleChart data={data} primaryColor={primaryColor} />
          : section.chartType === "bar" && data.length > 4
            ? <HorizontalBarChart data={data} primaryColor={primaryColor} accentColor={accentColor} />
            : section.chartType === "bar"
              ? <VerticalBarChart data={data} primaryColor={primaryColor} />
              : <DonutChart data={data} primaryColor={primaryColor} isDonut={section.chartType === "donut"} centerLabel={donutCenter} />
        }

        {section.insight && (
          <p style={{ color: primaryColor, fontSize: 10, lineHeight: 1.35, marginTop: 6, opacity: 0.5, fontStyle: "italic", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, flexShrink: 0 }}>
            {section.insight}
          </p>
        )}
      </div>
    </div>
  );
}
