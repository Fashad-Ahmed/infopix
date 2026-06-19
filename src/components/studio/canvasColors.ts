import type { SlotColorRole } from "../../mastra/schemas/schema";

export function luminance(hex: string): number {
  const h = (hex || "#ffffff").replace("#", "").padEnd(6, "f");
  const r = parseInt(h.slice(0, 2), 16) / 255;
  const g = parseInt(h.slice(2, 4), 16) / 255;
  const b = parseInt(h.slice(4, 6), 16) / 255;
  return 0.299 * r + 0.587 * g + 0.114 * b;
}

export function resolveSlotColors(
  role: SlotColorRole,
  style: { primaryColor: string; secondaryColor: string; accentColor: string },
  canvasBgDark: boolean,
): { bg: string; text: string; accent: string } {
  switch (role) {
    case "primary": {
      const bg = style.primaryColor;
      return { bg, text: luminance(bg) > 0.45 ? "#111111" : "#ffffff", accent: style.accentColor };
    }
    case "accent": {
      const bg = style.accentColor;
      return { bg, text: luminance(bg) > 0.45 ? "#111111" : "#ffffff", accent: style.primaryColor };
    }
    case "accent-alt": {
      // Slightly lighter/darker variant of accent
      const bg = style.accentColor;
      return { bg, text: luminance(bg) > 0.45 ? "#111111" : "#ffffff", accent: style.primaryColor };
    }
    case "footer": {
      const bg = style.secondaryColor;
      return { bg, text: luminance(bg) > 0.45 ? "rgba(0,0,0,0.45)" : "rgba(255,255,255,0.45)", accent: style.accentColor };
    }
    case "surface-alt": {
      // Alt cards get a subtle brand-primary tint so they visually separate from plain surface.
      const bg = canvasBgDark ? "rgba(255,255,255,0.18)" : "rgba(18,16,66,0.05)";
      return { bg, text: style.primaryColor, accent: style.accentColor };
    }
    case "surface":
    default: {
      // Light canvas → solid white card for clean contrast against warm beige.
      // Dark canvas → subtle white lift.
      const bg = canvasBgDark ? "rgba(255,255,255,0.12)" : "#ffffff";
      return { bg, text: style.primaryColor, accent: style.accentColor };
    }
  }
}
