"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { lighten, type Datum } from "./chartUtils";
import { ChartTooltip } from "./ChartTooltip";
import { ValueLegend } from "./ValueLegend";

export function DonutChart({ data, primaryColor, bgColor, isDonut, centerLabel }: {
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
