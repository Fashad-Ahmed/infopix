"use client";

import { useState } from "react";
import { lighten, type Datum } from "./chartUtils";

export function HorizontalBarChart({ data, primaryColor, accentColor }: {
  data: Datum[]; primaryColor: string; accentColor: string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const maxVal = Math.max(...data.map(d => d.value), 1);

  return (
    <div style={{ width: "100%", flex: "0 1 auto", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 6, minHeight: 0, overflow: "hidden" }}>
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
