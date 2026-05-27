"use client";

type Props = {
  primaryColor: string;
  accentColor: string;
  width: number;
  height: number;
  fill?: boolean;
};

export function FooterRegion({ primaryColor, accentColor, width, height, fill }: Props) {
  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", borderTop: `2px solid ${accentColor}`, display: "flex", alignItems: "center", padding: "0 20px", boxSizing: "border-box", gap: 8 }
    : { width, height,               borderTop: `2px solid ${accentColor}`, display: "flex", alignItems: "center", padding: "0 20px", boxSizing: "border-box", gap: 8 };

  return (
    <div style={rootStyle}>
      <span style={{ color: primaryColor, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
        InfoPix Studio
      </span>
      <span style={{ color: primaryColor, opacity: 0.2, fontSize: 10 }}>·</span>
      <span style={{ color: primaryColor, fontSize: 10, opacity: 0.4 }}>
        Generated with AI
      </span>
    </div>
  );
}
