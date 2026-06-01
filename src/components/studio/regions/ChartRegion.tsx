"use client";

import { useState } from "react";
import {
  Area, AreaChart, Cell, Pie, PieChart, RadialBar, RadialBarChart,
  ResponsiveContainer, Tooltip,
} from "recharts";
import type { ChartSection } from "../../../types/infographic";
import { resolveIcon } from "../iconMap";

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

type Datum = { name: string; value: number; valueLabel?: string; fill: string };

const CHART_PALETTE = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#06b6d4", "#f43f5e", "#84cc16", "#f97316"];

// Lighten a hex toward white by ratio (0..1) — used for gradient stops.
function lighten(hex: string, ratio: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * ratio);
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, "0")).join("")}`;
}

function ChartTooltip({ active, payload, primaryColor, bgColor }: {
  active?: boolean;
  payload?: Array<{ payload: Datum }>;
  primaryColor: string;
  bgColor: string;
}) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: bgColor.startsWith("#") ? bgColor : "#1e293b",
      border: `1px solid ${d.fill}`,
      borderRadius: 6, padding: "4px 8px",
      fontSize: 11, color: primaryColor, fontWeight: 600,
      boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
    }}>
      <span style={{ color: d.fill, fontWeight: 900 }}>{d.valueLabel ?? d.value}</span>
      {"  "}{d.name}
    </div>
  );
}

// Compact value-rich legend (denser than recharts default).
function ValueLegend({ data, primaryColor }: { data: Datum[]; primaryColor: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 3, justifyContent: "center", minWidth: 0 }}>
      {data.map((d, i) => (
        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", backgroundColor: d.fill, flexShrink: 0 }} />
          <span style={{ fontSize: 10, color: primaryColor, opacity: 0.75, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1, minWidth: 0 }}>
            {d.name}
          </span>
          <span style={{ fontSize: 10, fontWeight: 900, color: d.fill, flexShrink: 0 }}>
            {d.valueLabel ?? d.value}
          </span>
        </div>
      ))}
    </div>
  );
}

function HorizontalBarChart({ data, primaryColor, accentColor }: {
  data: Datum[]; primaryColor: string; accentColor: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: "100%", flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 6, minHeight: 0, overflow: "hidden" }}>
      {data.map((item, i) => {
        const active = hover === i;
        return (
          <div
            key={i}
            title={item.valueLabel ? `${item.name}: ${item.valueLabel}` : item.name}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ display: "flex", alignItems: "center", gap: 8, transition: "transform 0.15s", transform: active ? "translateX(2px)" : "none" }}
          >
            <span style={{ width: "30%", fontSize: 11, color: primaryColor, fontWeight: 600, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flexShrink: 0, opacity: active ? 1 : 0.8 }}>
              {item.name}
            </span>
            <div style={{ flex: 1, height: 11, backgroundColor: `${accentColor}1f`, borderRadius: 10, overflow: "hidden", minWidth: 0 }}>
              <div style={{
                width: `${(item.value / maxVal) * 100}%`, height: "100%",
                background: `linear-gradient(90deg, ${lighten(item.fill, 0.25)}, ${item.fill})`,
                borderRadius: 10, transition: "filter 0.15s",
                filter: active ? "brightness(1.08)" : "none",
                boxShadow: active ? `0 0 0 1px ${item.fill}55` : "none",
              }} />
            </div>
            <span style={{ width: "14%", fontSize: 11, color: item.fill, fontWeight: 800, textAlign: "right", flexShrink: 0 }}>
              {item.valueLabel ?? item.value}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function VerticalBarChart({ data, primaryColor }: { data: Datum[]; primaryColor: string }) {
  const [hover, setHover] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "flex-end", justifyContent: "space-around", gap: 4, minHeight: 0 }}>
      {data.map((item, i) => {
        const active = hover === i;
        return (
          <div
            key={i}
            title={item.valueLabel ? `${item.name}: ${item.valueLabel}` : item.name}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 3, height: "100%", justifyContent: "flex-end", minWidth: 0 }}
          >
            <span style={{ fontSize: 11, color: item.fill, fontWeight: 900, whiteSpace: "nowrap" }}>
              {item.valueLabel ?? item.value}
            </span>
            <div style={{
              width: "62%", minWidth: 8, borderRadius: "4px 4px 0 0",
              height: `${Math.max(4, (item.value / maxVal) * 100)}%`,
              background: `linear-gradient(180deg, ${lighten(item.fill, 0.3)}, ${item.fill})`,
              transition: "filter 0.15s, transform 0.15s",
              filter: active ? "brightness(1.1)" : "none",
              transform: active ? "scaleY(1.02)" : "none", transformOrigin: "bottom",
              boxShadow: active ? `0 0 0 1px ${item.fill}55` : "none",
            }} />
            <span style={{ fontSize: 9, color: primaryColor, opacity: 0.65, textAlign: "center", overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", width: "100%" }}>
              {item.name}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function BubbleChart({ data }: { data: Datum[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const max = Math.max(...data.map(d => d.value), 1);
  const sorted = [...data].sort((a, b) => b.value - a.value);

  return (
    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", justifyContent: "space-around", flexWrap: "wrap", gap: 6, padding: "4px 0", minHeight: 0 }}>
      {sorted.map((item, i) => {
        const ratio = Math.sqrt(item.value / max);
        const size = Math.max(36, Math.round(ratio * 100));
        const fontSize = Math.max(8, Math.round(size * 0.17));
        const active = hover === i;
        return (
          <div
            key={i}
            title={item.valueLabel ? `${item.name}: ${item.valueLabel}` : item.name}
            onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
            style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 5, flexShrink: 0, transition: "transform 0.15s", transform: active ? "scale(1.06)" : "none" }}
          >
            <div style={{
              width: size, height: size, borderRadius: "50%",
              background: `radial-gradient(circle at 35% 30%, ${lighten(item.fill, 0.35)}, ${item.fill})`,
              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              boxShadow: active ? `0 6px 16px ${item.fill}66` : `0 2px 6px ${item.fill}33`,
              transition: "box-shadow 0.15s",
            }}>
              <span style={{ fontSize, fontWeight: 800, color: "#fff", textAlign: "center", padding: "0 4px", lineHeight: 1.2, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>
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

function DonutChart({ data, primaryColor, bgColor, isDonut, centerLabel }: {
  data: Datum[]; primaryColor: string; bgColor: string; isDonut: boolean; centerLabel?: string;
}) {
  const innerRatio = isDonut ? 0.55 : 0;
  const gradId = (i: number) => `grad-pie-${i}`;

  return (
    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", minHeight: 120 }}>
      <div style={{ position: "relative", width: "58%", height: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <defs>
              {data.map((d, i) => (
                <linearGradient key={i} id={gradId(i)} x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor={lighten(d.fill, 0.28)} />
                  <stop offset="100%" stopColor={d.fill} />
                </linearGradient>
              ))}
            </defs>
            <Pie
              data={data} dataKey="value" nameKey="name"
              cx="50%" cy="50%"
              innerRadius={`${Math.round(innerRatio * 78)}%`}
              outerRadius="78%"
              paddingAngle={isDonut ? 3 : 1}
              startAngle={90} endAngle={-270}
              isAnimationActive
            >
              {data.map((entry, i) => <Cell key={i} fill={`url(#${gradId(i)})`} stroke={bgColor} strokeWidth={1.5} />)}
            </Pie>
            <Tooltip content={<ChartTooltip primaryColor={primaryColor} bgColor={bgColor} />} />
          </PieChart>
        </ResponsiveContainer>
        {isDonut && centerLabel && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", textAlign: "center", pointerEvents: "none" }}>
            <span style={{ fontSize: 15, fontWeight: 900, color: primaryColor, lineHeight: 1 }}>{centerLabel}</span>
          </div>
        )}
      </div>
      <div style={{ width: "42%", height: "100%", display: "flex", paddingLeft: 6, minWidth: 0 }}>
        <ValueLegend data={data} primaryColor={primaryColor} />
      </div>
    </div>
  );
}

function RadialChart({ data, primaryColor }: { data: Datum[]; primaryColor: string }) {
  // Clamp values to 0-100 for ring fill; show 3-6 rings.
  const rings = data.slice(0, 6).map(d => ({ ...d, value: Math.min(Math.max(d.value, 0), 100) }));
  const gradId = (i: number) => `grad-radial-${i}`;
  return (
    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", minHeight: 120 }}>
      <div style={{ width: "58%", height: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            data={rings} innerRadius="30%" outerRadius="100%"
            startAngle={90} endAngle={-270} barSize={9}
          >
            <defs>
              {rings.map((d, i) => (
                <linearGradient key={i} id={gradId(i)} x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor={lighten(d.fill, 0.3)} />
                  <stop offset="100%" stopColor={d.fill} />
                </linearGradient>
              ))}
            </defs>
            <RadialBar background={{ fill: `${primaryColor}14` }} dataKey="value" cornerRadius={6} isAnimationActive>
              {rings.map((d, i) => <Cell key={i} fill={`url(#${gradId(i)})`} />)}
            </RadialBar>
            <Tooltip content={<ChartTooltip primaryColor={primaryColor} bgColor="#1e293b" />} />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ width: "42%", height: "100%", display: "flex", paddingLeft: 6, minWidth: 0 }}>
        <ValueLegend data={rings} primaryColor={primaryColor} />
      </div>
    </div>
  );
}

function TrendAreaChart({ data, primaryColor, accentColor }: {
  data: Datum[]; primaryColor: string; accentColor: string;
}) {
  return (
    <div style={{ width: "100%", flex: 1, minHeight: 110, position: "relative" }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 18, right: 8, left: 8, bottom: 4 }}>
          <defs>
            <linearGradient id="grad-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={accentColor} stopOpacity={0.45} />
              <stop offset="100%" stopColor={accentColor} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <Area
            type="monotone" dataKey="value"
            stroke={accentColor} strokeWidth={2.5}
            fill="url(#grad-area)"
            dot={{ r: 3, fill: accentColor, strokeWidth: 0 }}
            activeDot={{ r: 5 }}
            isAnimationActive
            label={{ position: "top", fontSize: 9, fill: primaryColor }}
          />
          <Tooltip content={<ChartTooltip primaryColor={primaryColor} bgColor="#1e293b" />} />
        </AreaChart>
      </ResponsiveContainer>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "0 8px", marginTop: -2 }}>
        {data.map((d, i) => (
          <span key={i} style={{ fontSize: 8, color: primaryColor, opacity: 0.55, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", flex: 1, textAlign: "center" }}>
            {d.name}
          </span>
        ))}
      </div>
    </div>
  );
}

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
