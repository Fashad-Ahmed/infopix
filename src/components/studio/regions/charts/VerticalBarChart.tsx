"use client";

import { useState } from "react";
import { lighten, type Datum } from "./chartUtils";

export function VerticalBarChart({ data, primaryColor }: { data: Datum[]; primaryColor: string }) {
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
