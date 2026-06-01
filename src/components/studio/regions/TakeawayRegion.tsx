"use client";

import type { TakeawaySection } from "../../../types/infographic";

type Props = {
  section: TakeawaySection;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  width: number;
  height: number;
  fill?: boolean;
};

export function TakeawayRegion({ section, primaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" }
    : { width, height,               backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" };

  return (
    <div style={rootStyle}>
      {section.imageUrl && (
        <div style={{ height: 65, flexShrink: 0, position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 20%, ${bgColor} 100%)` }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: "12px 20px 14px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px 0", opacity: 0.75, flexShrink: 0 }}>
        {section.heading}
      </p>

      <div style={{ flex: 1, minHeight: 0, overflow: "hidden", display: "flex", flexDirection: "row", flexWrap: "wrap", gap: 6, alignContent: "flex-start" }}>
        {section.points.map((point, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, flex: "1 0 180px", minWidth: 0 }}>
            <span style={{
              minWidth: 20, height: 20,
              borderRadius: "50%",
              backgroundColor: accentColor,
              color: "#fff",
              fontSize: 10,
              fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}>
              {i + 1}
            </span>
            <p style={{ color: primaryColor, fontSize: 10, lineHeight: 1.4, margin: 0, fontWeight: 500, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, minWidth: 0 }}>
              {point}
            </p>
          </div>
        ))}
      </div>

      {section.insight && (
        <p style={{ color: primaryColor, fontSize: 9, opacity: 0.5, fontStyle: "italic", lineHeight: 1.35, marginTop: 8, flexShrink: 0 }}>
          {section.insight}
        </p>
      )}
      </div>
    </div>
  );
}
