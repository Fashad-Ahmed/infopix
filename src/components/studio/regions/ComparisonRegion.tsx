"use client";

import type { ComparisonSection } from "../../../types/infographic";

type Props = {
  section: ComparisonSection;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  width: number;
  height: number;
  fill?: boolean;
};

export function ComparisonRegion({ section, primaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" }
    : { width, height,               backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" };

  return (
    <div style={rootStyle}>
      {section.imageUrl && (
        <div style={{ flex: "0 0 30%", position: "relative", overflow: "hidden", minHeight: 50 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 30%, ${bgColor} 100%)` }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: "12px 20px 14px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6 }}>
      <div>
        <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0, opacity: 0.8 }}>
          {section.heading}
        </p>
        {section.scaleDescription && (
          <p style={{ color: primaryColor, fontSize: 9, margin: "2px 0 0", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {section.scaleDescription}
          </p>
        )}
      </div>

      <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly", minHeight: 0 }}>
        {section.items?.map((item, i) => (
          <div key={i}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4, alignItems: "baseline" }}>
              <span style={{ color: primaryColor, fontSize: 11, fontWeight: item.isHighlight ? 800 : 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "70%" }}>
                {item.label}
              </span>
              <span style={{ color: item.isHighlight ? accentColor : primaryColor, fontSize: 12, fontWeight: 800, opacity: item.isHighlight ? 1 : 0.65, flexShrink: 0, marginLeft: 4 }}>
                {item.valueLabel ?? item.value}
              </span>
            </div>
            <div style={{ width: "100%", height: 8, backgroundColor: `${accentColor}20`, borderRadius: 8 }}>
              <div style={{
                width: `${Math.min(item.value, 100)}%`, height: "100%",
                backgroundColor: item.isHighlight ? accentColor : `${accentColor}70`,
                borderRadius: 8,
              }} />
            </div>
            {item.description && (
              <p style={{ color: primaryColor, fontSize: 9, opacity: 0.45, margin: "2px 0 0", lineHeight: 1.3 }}>
                {item.description}
              </p>
            )}
          </div>
        ))}
      </div>

      {section.insight && (
        <p style={{ color: primaryColor, fontSize: 9, opacity: 0.5, fontStyle: "italic", lineHeight: 1.35, marginTop: 4, flexShrink: 0 }}>
          {section.insight}
        </p>
      )}
      </div>
    </div>
  );
}
