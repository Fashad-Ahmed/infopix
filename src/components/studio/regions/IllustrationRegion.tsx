"use client";

type Props = {
  imageUrl?: string;
  bgColor: string;
  primaryColor: string;
  width: number;
  height: number;
};

export function IllustrationRegion({ imageUrl, bgColor, primaryColor, width, height }: Props) {
  if (!imageUrl) {
    return (
      <div style={{
        width, height,
        backgroundColor: `${primaryColor}0a`,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}>
        <svg width={Math.min(width * 0.3, 48)} height={Math.min(height * 0.3, 48)} viewBox="0 0 24 24" fill="none" stroke={primaryColor} strokeWidth="1.5" opacity={0.2}>
          <rect x="3" y="3" width="18" height="18" rx="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      </div>
    );
  }

  return (
    <div style={{ width, height, backgroundColor: bgColor, overflow: "hidden" }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}
