"use client";

import { useState } from "react";
import type { ComparisonSection } from "../../../types/infographic";
import { resolveIcon } from "../iconMap";

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
  const [hover, setHover] = useState<number | null>(null);
  const HeadingIcon = resolveIcon(section.icon, section.heading);
  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" }
    : { width, height,               backgroundColor: bgColor, display: "flex", flexDirection: "column", overflow: "hidden" };

  const items = section.items ?? [];
  // Drop per-item descriptions when the list is long — keeps rows from overflowing.
  const showDescriptions = items.length <= 4;

  return (
    <div style={rootStyle}>
      {section.imageUrl && items.length <= 3 && (
        <div style={{ flex: "0 0 auto", height: 52, position: "relative", overflow: "hidden" }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, transparent 20%, ${bgColor} 100%)` }} />
        </div>
      )}
      <div style={{ flex: 1, minHeight: 0, padding: "12px 20px 14px", boxSizing: "border-box", display: "flex", flexDirection: "column", gap: 6 }}>
      <div>
        <p style={{ color: primaryColor, fontSize: 11, fontWeight: 800, letterSpacing: "0.1em", textTransform: "uppercase", margin: 0, opacity: 0.85, display: "flex", alignItems: "center", gap: 6 }}>
          {HeadingIcon && <HeadingIcon size={14} color={accentColor} strokeWidth={2.4} style={{ flexShrink: 0 }} aria-hidden />}
          <span style={{ overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }}>{section.heading}</span>
        </p>
        {section.scaleDescription && (
          <p style={{ color: primaryColor, fontSize: 9, margin: "2px 0 0", opacity: 0.5, textTransform: "uppercase", letterSpacing: "0.06em" }}>
            {section.scaleDescription}
          </p>
        )}
      </div>

      <div style={{ flex: "0 1 auto", display: "flex", flexDirection: "column", justifyContent: "flex-start", gap: 7, minHeight: 0, overflow: "hidden" }}>
        {items.map((item, i) => {
          const ItemIcon = resolveIcon(item.icon, item.label, item.description);
          const active = hover === i;
          const barColor = item.isHighlight ? accentColor : `${accentColor}70`;
          return (
            <div
              key={i}
              title={item.description ?? item.label}
              onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}
              style={{ transition: "transform 0.15s", transform: active ? "translateX(2px)" : "none" }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 3, alignItems: "center", gap: 6 }}>
                <span style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 0, maxWidth: "72%" }}>
                  {ItemIcon && <ItemIcon size={12} color={item.isHighlight ? accentColor : primaryColor} strokeWidth={2.4} style={{ flexShrink: 0, opacity: item.isHighlight ? 1 : 0.6 }} aria-hidden />}
                  <span style={{ color: primaryColor, fontSize: 11, fontWeight: item.isHighlight ? 800 : 500, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }}>
                    {item.label}
                  </span>
                </span>
                <span style={{ color: item.isHighlight ? accentColor : primaryColor, fontSize: 12, fontWeight: 800, opacity: item.isHighlight ? 1 : 0.65, flexShrink: 0 }}>
                  {item.valueLabel ?? item.value}
                </span>
              </div>
              <div style={{ width: "100%", height: 9, backgroundColor: `${accentColor}1f`, borderRadius: 8, overflow: "hidden" }}>
                <div style={{
                  width: `${Math.min(item.value, 100)}%`, height: "100%",
                  background: `linear-gradient(90deg, ${barColor}, ${item.isHighlight ? accentColor : barColor})`,
                  borderRadius: 8, transition: "filter 0.15s",
                  filter: active ? "brightness(1.1)" : "none",
                }} />
              </div>
              {showDescriptions && item.description && (
                <p style={{ color: primaryColor, fontSize: 9, opacity: active ? 0.7 : 0.45, margin: "2px 0 0", lineHeight: 1.3, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 1, transition: "opacity 0.15s" }}>
                  {item.description}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {section.insight && (
        <p style={{ color: primaryColor, fontSize: 9, opacity: 0.5, fontStyle: "italic", lineHeight: 1.35, marginTop: 4, flexShrink: 0, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>
          {section.insight}
        </p>
      )}
      </div>
    </div>
  );
}
