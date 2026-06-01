"use client";

import type { CalloutSection } from "../../../types/infographic";
import { resolveIcon } from "../iconMap";

type Props = {
  section: CalloutSection;
  primaryColor: string;
  accentColor: string;
  bgColor: string;
  width: number;
  height: number;
  fill?: boolean;
};

function luminance(hex: string): number {
  if (!hex.startsWith("#")) return 0.5;
  const h = hex.replace("#", "").padEnd(6, "0");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function CalloutRegion({ section, primaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const textColor = luminance(bgColor) > 0.45 ? "#111111" : "#ffffff";
  const subColor  = `${textColor}bb`;
  const dimColor  = `${textColor}77`;
  const Icon = resolveIcon(section.icon, section.heading, section.quote, section.stat);

  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 16px", boxSizing: "border-box", textAlign: "center", overflow: "hidden", gap: 4, position: "relative" }
    : { width, height,               backgroundColor: bgColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "10px 16px", boxSizing: "border-box", textAlign: "center", overflow: "hidden", gap: 4, position: "relative" };

  return (
    <div style={rootStyle}>
      {/* Background hero image with overlay */}
      {section.imageUrl && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={section.imageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, backgroundColor: bgColor, opacity: 0.78 }} />
        </div>
      )}
      {/* Large decorative quotation mark */}
      <div style={{ position: "absolute", top: 2, left: 12, fontSize: 56, fontWeight: 900, color: textColor, opacity: 0.08, lineHeight: 1, userSelect: "none", pointerEvents: "none", zIndex: 1 }}>
        &ldquo;
      </div>

      {(Icon || section.heading) && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, position: "relative", zIndex: 1, maxWidth: "100%", flexShrink: 0 }}>
          {Icon && <Icon size={15} color={accentColor} strokeWidth={2.6} style={{ flexShrink: 0 }} aria-hidden />}
          {section.heading && (
            <p style={{ fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", color: accentColor, margin: 0, opacity: 0.9, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", minWidth: 0 }}>
              {section.heading}
            </p>
          )}
        </div>
      )}

      {/* Big stat */}
      {section.stat && (
        <div style={{
          fontSize: "clamp(22px, 5.5cqw, 44px)",
          fontWeight: 900,
          color: textColor,
          lineHeight: 1,
          letterSpacing: "-0.04em",
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
          maxWidth: "100%",
          flexShrink: 0,
        }}>
          {section.stat}
        </div>
      )}

      {/* Quote text */}
      <p style={{
        fontSize: "clamp(9px, 1.2cqw, 12px)",
        color: subColor,
        lineHeight: 1.4,
        fontStyle: "italic",
        maxWidth: "94%",
        overflow: "hidden",
        display: "-webkit-box",
        WebkitBoxOrient: "vertical",
        WebkitLineClamp: 3,
        margin: 0,
        position: "relative",
        zIndex: 1,
        minHeight: 0,
      }}>
        {section.quote}
      </p>

      {/* Attribution */}
      {section.attribution && (
        <p style={{
          fontSize: 9,
          color: dimColor,
          fontWeight: 600,
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          margin: 0,
          position: "relative",
          zIndex: 1,
          overflow: "hidden",
          whiteSpace: "nowrap",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          flexShrink: 0,
        }}>
          {section.attribution}
        </p>
      )}

      {/* Bottom accent line */}
      <div style={{ position: "absolute", bottom: 0, left: "20%", right: "20%", height: 3, backgroundColor: accentColor, opacity: 0.4, borderRadius: "3px 3px 0 0" }} />
    </div>
  );
}
