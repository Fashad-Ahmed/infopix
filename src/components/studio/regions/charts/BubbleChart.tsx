"use client";

import { useState } from "react";
import { lighten, type Datum } from "./chartUtils";

export function BubbleChart({ data }: { data: Datum[] }) {
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
