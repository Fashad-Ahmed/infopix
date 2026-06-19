export type Datum = { name: string; value: number; valueLabel?: string; fill: string };

export const CHART_PALETTE = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#06b6d4", "#f43f5e", "#84cc16", "#f97316"];

// Lightens a hex toward white by ratio (0..1) — used for gradient stops.
export function lighten(hex: string, ratio: number): string {
  if (!hex.startsWith("#") || hex.length < 7) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const mix = (c: number) => Math.round(c + (255 - c) * ratio);
  return `#${[mix(r), mix(g), mix(b)].map(c => c.toString(16).padStart(2, "0")).join("")}`;
}
