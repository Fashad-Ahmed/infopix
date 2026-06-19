"use client";

import { Cell, RadialBar, RadialBarChart as RechartsRadialBarChart, ResponsiveContainer, Tooltip } from "recharts";
import { lighten, type Datum } from "./chartUtils";
import { ChartTooltip } from "./ChartTooltip";
import { ValueLegend } from "./ValueLegend";

export function RadialChart({ data, primaryColor }: { data: Datum[]; primaryColor: string }) {
  // Clamp values to 0-100 for ring fill; show 3-6 rings.
  const rings = data.slice(0, 6).map(d => ({ ...d, value: Math.min(Math.max(d.value, 0), 100) }));
  const gradId = (i: number) => `grad-radial-${i}`;
  return (
    <div style={{ width: "100%", flex: 1, display: "flex", alignItems: "center", minHeight: 120 }}>
      <div style={{ width: "58%", height: "100%", minWidth: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <RechartsRadialBarChart
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
          </RechartsRadialBarChart>
        </ResponsiveContainer>
      </div>
      <div style={{ width: "42%", height: "100%", display: "flex", paddingLeft: 6, minWidth: 0 }}>
        <ValueLegend data={rings} primaryColor={primaryColor} />
      </div>
    </div>
  );
}
