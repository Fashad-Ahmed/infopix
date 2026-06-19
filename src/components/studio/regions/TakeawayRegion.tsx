"use client";

import type { TakeawaySection } from "../../../types/infographic";
import { resolveIcon } from "../iconMap";

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
  const HeadingIcon = resolveIcon(section.icon, section.heading);
  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" }
    : { width, height,               backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" };

  // Takeaway is text-dense; a photo band here only steals room and clips points.
  const lineClamp = section.points.length <= 6 ? 3 : 2;

  return (
    <div style={rootStyle}>
      <div style={{ flex: 1, minHeight: 0, padding: "12px 20px 14px", boxSizing: "border-box", display: "flex", flexDirection: "column" }}>
      <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: "0 0 10px 0", opacity: 0.85, flexShrink: 0, display: "flex", alignItems: "center", gap: 6 }}>
        {HeadingIcon && <HeadingIcon size={14} color={accentColor} strokeWidth={2.4} style={{ flexShrink: 0 }} aria-hidden />}
        <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }}>{section.heading}</span>
      </p>

      <div style={{
        flex: "0 1 auto", minHeight: 0, overflow: "hidden",
        display: "grid",
        gridTemplateColumns: section.points.length > 3 ? "1fr 1fr" : "1fr",
        gridAutoRows: "min-content",
        columnGap: 16, rowGap: 8, alignContent: "flex-start",
      }}>
        {section.points.map((point, i) => (
          <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, minWidth: 0, overflow: "hidden" }}>
            <span style={{
              width: 18, height: 18,
              borderRadius: "50%",
              backgroundColor: accentColor,
              color: "#fff",
              fontSize: 9,
              fontWeight: 900,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
              marginTop: 1,
            }}>
              {i + 1}
            </span>
            <p style={{ color: primaryColor, fontSize: 10, lineHeight: 1.35, margin: 0, fontWeight: 500, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: lineClamp, minWidth: 0 }}>
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
