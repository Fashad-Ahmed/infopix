"use client";

import type { Datum } from "./chartUtils";

export function ChartTooltip({ active, payload, primaryColor, bgColor }: {
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
