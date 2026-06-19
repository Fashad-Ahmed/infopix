"use client";

import { Area, AreaChart, ResponsiveContainer, Tooltip } from "recharts";
import type { Datum } from "./chartUtils";
import { ChartTooltip } from "./ChartTooltip";

export function TrendAreaChart({ data, primaryColor, accentColor }: {
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
