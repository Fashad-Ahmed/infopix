"use client";

type Props = {
  primaryColor: string;
  accentColor: string;
  width: number;
  height: number;
  fill?: boolean;
  logoDataUrl?: string | null;
  logoAlign?: "left" | "right";
  footerText?: string | null;
};

export function FooterRegion({ primaryColor, accentColor, width, height, fill, logoDataUrl, logoAlign, footerText }: Props) {
  const rootStyle: React.CSSProperties = fill
    ? { width: "100%", height: "100%", borderTop: `2px solid ${accentColor}`, display: "flex", alignItems: "center", padding: "0 20px", boxSizing: "border-box", gap: 8 }
    : { width, height,               borderTop: `2px solid ${accentColor}`, display: "flex", alignItems: "center", padding: "0 20px", boxSizing: "border-box", gap: 8 };

  const logo = logoDataUrl && (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img src={logoDataUrl} alt="" style={{ maxHeight: 22, maxWidth: 90, objectFit: "contain", display: "block" }} />
  );

  return (
    <div style={rootStyle}>
      {logo && logoAlign === "left" && logo}
      {footerText ? (
        <span style={{ color: primaryColor, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
          {footerText}
        </span>
      ) : (
        <>
          <span style={{ color: primaryColor, fontSize: 10, fontWeight: 800, letterSpacing: "0.12em", textTransform: "uppercase", opacity: 0.5 }}>
            MemorAIz
          </span>
          <span style={{ color: primaryColor, opacity: 0.2, fontSize: 10 }}>·</span>
          <span style={{ color: primaryColor, fontSize: 10, opacity: 0.4 }}>
            Generated with AI
          </span>
        </>
      )}
      {logo && logoAlign === "right" && <span style={{ marginLeft: "auto", display: "flex" }}>{logo}</span>}
    </div>
  );
}
