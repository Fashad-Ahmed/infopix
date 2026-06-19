"use client";

import type { Datum } from "./chartUtils";

// Compact value-rich legend (denser than recharts default).
export function ValueLegend({ data, primaryColor }: { data: Datum[]; primaryColor: string }) {
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
