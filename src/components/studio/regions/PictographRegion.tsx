"use client";

import { User } from "lucide-react";
import type { PictographSection } from "../../../types/infographic";
import { resolveIcon, resolveIconOr } from "../iconMap";

type Props = {
  section: PictographSection;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  width: number;
  height: number;
  fill?: boolean;
};

export function PictographRegion({ section, primaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const HeadingIcon = resolveIcon(section.icon, section.heading);
  // The glyph repeated across each row (cups, cars, people…).
  const Glyph = resolveIconOr(User, section.iconToken, section.iconLabel, section.heading);
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
        <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 3px 0", opacity: 0.85, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
          {HeadingIcon && <HeadingIcon size={14} color={accentColor} strokeWidth={2.4} style={{ flexShrink: 0 }} aria-hidden />}
          <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }}>{section.heading}</span>
        </p>
        {section.iconLabel && (
          <p style={{ color: primaryColor, fontSize: 9, opacity: 0.5, margin: "0 0 8px 0", textTransform: "uppercase", letterSpacing: "0.06em", flexShrink: 0, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis" }}>
            {section.iconLabel}
          </p>
        )}

        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 6, minHeight: 0, overflow: "hidden" }}>
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
                      <Glyph
                        key={idx}
                        size={iconSize}
                        color={accentColor}
                        strokeWidth={2.2}
                        style={{ opacity: filled ? 1 : isPartial ? 0.5 : 0.22, flexShrink: 0 }}
                        aria-hidden
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
