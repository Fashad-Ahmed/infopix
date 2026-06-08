"use client";

type Props = {
  title: string;
  summary: string;
  heroImageUrl?: string;
  accentStyle: string;
  primaryColor: string;
  accentColor: string;
  width: number;
  height: number;
  fill?: boolean;
  logoDataUrl?: string | null;
  logoAlign?: "left" | "right";
};

function luminance(hex: string): number {
  const h = hex.replace("#", "");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function BannerRegion({ title, summary, heroImageUrl, accentStyle, primaryColor, accentColor, width, height, fill, logoDataUrl, logoAlign = "right" }: Props) {
  const isLight = luminance(primaryColor) > 0.45;
  const textColor = isLight ? "#111111" : "#ffffff";
  const subColor  = isLight ? "rgba(0,0,0,0.60)" : "rgba(255,255,255,0.65)";

  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", backgroundColor: primaryColor, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }
    : { width, height, backgroundColor: primaryColor, position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" };

  return (
    <div style={rootStyle}>
      {/* Brand logo */}
      {logoDataUrl && (
        <div
          style={{
            position: "absolute",
            top: 12,
            [logoAlign]: 16,
            zIndex: 3,
            maxWidth: "28%",
            maxHeight: 36,
            display: "flex",
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={logoDataUrl} alt="" style={{ maxWidth: "100%", maxHeight: 36, objectFit: "contain", display: "block" }} />
        </div>
      )}

      {/* Hero image */}
      {heroImageUrl && (
        <div style={{ position: "absolute", inset: 0, zIndex: 0 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={heroImageUrl} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top", display: "block" }} />
          <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${primaryColor}55 0%, ${primaryColor}cc 40%, ${primaryColor}f5 70%, ${primaryColor} 100%)` }} />
        </div>
      )}

      {/* Diagonal accent shape — top-right corner decoration */}
      {accentStyle !== "none" && (
        <svg
          style={{ position: "absolute", top: 0, right: 0, zIndex: 1, pointerEvents: "none" }}
          width="120" height="120" viewBox="0 0 120 120"
        >
          <polygon points="120,0 120,120 0,0" fill={accentColor} fillOpacity="0.22" />
        </svg>
      )}

      {/* Ribbon top stripe */}
      {accentStyle === "ribbon" && (
        <div style={{ height: 8, backgroundColor: accentColor, flexShrink: 0, zIndex: 2, position: "relative" }} />
      )}

      {/* Text content — all children flex-shrink so short banners (landscape 110px) compress gracefully */}
      <div style={{ flex: 1, minHeight: 0, padding: "12px 24px", position: "relative", zIndex: 2, display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden", boxSizing: "border-box" }}>
        {accentStyle === "rule" && (
          <div style={{ width: 40, height: 4, backgroundColor: accentColor, marginBottom: 8, borderRadius: 2, flexShrink: 1 }} />
        )}

        <h1 style={{
          color: textColor,
          fontSize: "clamp(12px, 2.6cqw, 34px)",
          fontWeight: 900,
          lineHeight: 1.08,
          letterSpacing: "-0.03em",
          margin: 0,
          textTransform: "uppercase",
          wordBreak: "break-word",
          overflow: "hidden",
          display: "-webkit-box",
          WebkitBoxOrient: "vertical",
          WebkitLineClamp: 2,
          flexShrink: 0,
          minHeight: 0,
        }}>
          {title}
        </h1>

        <p style={{
          color: subColor, fontSize: "clamp(9px, 1.2cqw, 13px)", lineHeight: 1.4, margin: "6px 0 0",
          maxWidth: "92%", overflow: "hidden",
          display: "-webkit-box", WebkitBoxOrient: "vertical", WebkitLineClamp: 2,
          flexShrink: 1, minHeight: 0,
        }}>
          {summary}
        </p>
      </div>

      {/* Stamp moved out of flow so it never pushes the title off-canvas */}
      {accentStyle === "stamp" && (
        <div style={{
          position: "absolute", bottom: 10, right: 16, zIndex: 2,
          border: `2px solid ${accentColor}`, color: accentColor,
          fontSize: 8, fontWeight: 800, letterSpacing: "0.18em",
          padding: "2px 7px", textTransform: "uppercase",
          transform: "rotate(-1.5deg)", pointerEvents: "none",
        }}>
          STUDIO
        </div>
      )}

      {/* Bottom accent stripe */}
      {(accentStyle === "ribbon" || accentStyle === "rule") && (
        <div style={{ height: 6, backgroundColor: accentColor, flexShrink: 0, zIndex: 2, position: "relative" }} />
      )}
    </div>
  );
}
