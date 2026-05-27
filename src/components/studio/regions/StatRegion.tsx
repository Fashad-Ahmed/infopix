"use client";

import type { MetricSection } from "../../../types/infographic";

type Props = {
  section: MetricSection;
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

function autoText(bg: string, fallback: string): string {
  if (!bg.startsWith("#")) return fallback;
  return luminance(bg) > 0.45 ? "#111111" : "#ffffff";
}

// Strip AI-generated padding chars from values
function cleanValue(v: string): string {
  return v.replace(/[_\s]+$/, "").trim();
}

function CircularStat({
  value, pct, textColor, accentColor, size,
}: { value: string; pct: number; textColor: string; accentColor: string; size: number }) {
  const strokeW = Math.max(8, size * 0.065);
  const r = size / 2 - strokeW - 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(Math.max(pct, 0), 100) / 100);
  const fontSize = Math.floor(size * 0.3);

  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={`${textColor}20`} strokeWidth={strokeW} />
        <circle
          cx={size / 2} cy={size / 2} r={r} fill="none"
          stroke={accentColor} strokeWidth={strokeW}
          strokeDasharray={String(circ)} strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ fontSize, fontWeight: 900, color: textColor, lineHeight: 1, letterSpacing: "-0.03em" }}>
          {value}
        </span>
      </div>
    </div>
  );
}

export function StatRegion({ section, primaryColor, accentColor, bgColor, width, height, fill }: Props) {
  const textColor = autoText(bgColor, primaryColor);
  const subColor  = `${textColor}99`;
  const isSolid   = bgColor.startsWith("#");

  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: bgColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 18px", boxSizing: "border-box", gap: 6, overflow: "hidden" }
    : { width, height,               backgroundColor: bgColor, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "14px 18px", boxSizing: "border-box", gap: 6, overflow: "hidden" };

  const rawValue = cleanValue(String(section.value));
  const isPercent = rawValue.endsWith("%");
  const numericPct = isPercent ? parseFloat(rawValue) : NaN;

  if (isPercent && !isNaN(numericPct)) {
    return (
      <div style={rootStyle}>
        <CircularStat
          value={rawValue} pct={numericPct}
          textColor={textColor} accentColor={isSolid ? textColor : accentColor}
          size={90}
        />
        <p style={{ color: textColor, fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", margin: 0, opacity: 0.8, textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, maxWidth: "100%" }}>
          {section.subheading ?? section.heading}
        </p>
        {section.insight && (
          <p style={{ color: textColor, fontSize: 9, lineHeight: 1.35, margin: 0, opacity: 0.5, textAlign: "center", overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2 }}>
            {section.insight}
          </p>
        )}
      </div>
    );
  }

  const leftBorderStyle: React.CSSProperties = isSolid ? {} : { borderLeft: `4px solid ${accentColor}` };

  return (
    <div style={{ ...rootStyle, alignItems: "flex-start", ...leftBorderStyle }}>
      <p style={{ color: textColor, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", margin: 0, opacity: 0.7, overflow: "hidden", whiteSpace: "nowrap", textOverflow: "ellipsis", maxWidth: "100%", flexShrink: 0 }}>
        {section.heading}
      </p>

      <div style={{ display: "flex", alignItems: "baseline", gap: 3, overflow: "hidden", minWidth: 0, maxWidth: "100%", flexShrink: 0 }}>
        {/* cqw works because slotStyle has containerType: inline-size */}
        <span style={{ fontSize: "clamp(32px, 12cqw, 64px)", fontWeight: 900, color: textColor, lineHeight: 1, flexShrink: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {rawValue}
        </span>
        {section.unit && (
          <span style={{ fontSize: "clamp(13px, 3.5cqw, 22px)", fontWeight: 700, color: isSolid ? `${textColor}cc` : accentColor, flexShrink: 0 }}>
            {cleanValue(section.unit)}
          </span>
        )}
        {(section.trend === "up" || section.trend === "down") && (
          <span style={{ fontSize: "clamp(12px, 3cqw, 18px)", color: section.trend === "up" ? (isSolid ? textColor : "#22c55e") : (isSolid ? textColor : "#ef4444"), fontWeight: 700, flexShrink: 0, opacity: isSolid ? 0.8 : 1 }}>
            {section.trend === "up" ? "▲" : "▼"}
          </span>
        )}
      </div>

      {section.subheading && (
        <p style={{ color: subColor, fontSize: 10, fontWeight: 600, margin: 0, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2, lineHeight: 1.3 }}>
          {section.subheading}
        </p>
      )}

      {section.insight && (
        <p style={{ color: textColor, fontSize: 9, lineHeight: 1.4, margin: 0, opacity: 0.55, overflow: "hidden", display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 3 }}>
          {section.insight}
        </p>
      )}
    </div>
  );
}
