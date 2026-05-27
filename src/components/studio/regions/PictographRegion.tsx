"use client";

import type { PictographSection } from "../../../types/infographic";

type Props = {
  section: PictographSection;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  width: number;
  height: number;
  fill?: boolean;
};

function PersonIcon({ size, filled, fillColor, emptyColor }: {
  size: number;
  filled: boolean;
  fillColor: string;
  emptyColor: string;
}) {
  const color = filled ? fillColor : emptyColor;
  return (
    <svg width={size} height={size} viewBox="0 0 20 20" fill={color}>
      <circle cx="10" cy="6" r="4" />
      <path d="M3 19c0-3.866 3.134-7 7-7s7 3.134 7 7" />
    </svg>
  );
}

export function PictographRegion({ section, primaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" }
    : { width, height, backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" };

  return (
    <div style={rootStyle}>
      {section.imageUrl && section.rows.length <= 2 && (
        <div style={{ height: 50, flexShrink: 0, position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 20%, ${bgColor} 100%)` }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: "10px 16px 12px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
        <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px 0", opacity: 0.8, flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
          {section.heading}
        </p>
        {section.iconLabel && (
          <p style={{ color: primaryColor, fontSize: 9, opacity: 0.5, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {section.iconLabel}
          </p>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-evenly" }}>
          {section.rows.map((row, i) => {
            const iconSize = 14;
            const icons = Array.from({ length: row.total }, (_, idx) => idx < Math.floor(row.count));
            const partialIdx = Math.floor(row.count);
            const partialFill = row.count % 1;

            return (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, minHeight: 0 }}>
                <span style={{
                  width: "22%", flexShrink: 0,
                  fontSize: 10, fontWeight: 700,
                  color: primaryColor, opacity: 0.85,
                  overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis",
                }}>
                  {row.label}
                </span>
                <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 2, alignItems: "center", minWidth: 0 }}>
                  {icons.map((filled, idx) => {
                    const isPartial = idx === partialIdx && partialFill > 0;
                    return (
                      <PersonIcon
                        key={idx}
                        size={iconSize}
                        filled={filled || isPartial}
                        fillColor={filled ? accentColor : isPartial ? `${accentColor}80` : accentColor}
                        emptyColor={`${primaryColor}25`}
                      />
                    );
                  })}
                </div>
                {row.valueLabel && (
                  <span style={{
                    flexShrink: 0,
                    fontSize: 11, fontWeight: 900,
                    color: accentColor,
                    minWidth: 32, textAlign: "right",
                  }}>
                    {row.valueLabel}
                  </span>
                )}
              </div>
            );
          })}
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
