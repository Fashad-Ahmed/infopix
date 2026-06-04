/** Relative luminance (WCAG) for sRGB hex. */
function luminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const raw = hex.replace("#", "").trim();
  const full =
    raw.length === 3
      ? raw
          .split("")
          .map((c) => c + c)
          .join("")
      : raw.slice(0, 6);
  return {
    r: parseInt(full.slice(0, 2), 16) || 0,
    g: parseInt(full.slice(2, 4), 16) || 0,
    b: parseInt(full.slice(4, 6), 16) || 0,
  };
}

function toHex(r: number, g: number, b: number): string {
  const clamp = (n: number) => Math.round(Math.max(0, Math.min(255, n)));
  return `#${[clamp(r), clamp(g), clamp(b)]
    .map((n) => n.toString(16).padStart(2, "0"))
    .join("")}`;
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
        break;
      case g:
        h = ((b - r) / d + 2) / 6;
        break;
      default:
        h = ((r - g) / d + 4) / 6;
    }
  }
  return [h * 360, s * 100, l * 100];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  h /= 360;
  s /= 100;
  l /= 100;
  if (s === 0) {
    const v = l * 255;
    return [v, v, v];
  }
  const hue2rgb = (p: number, q: number, t: number) => {
    let x = t;
    if (x < 0) x += 1;
    if (x > 1) x -= 1;
    if (x < 1 / 6) return p + (q - p) * 6 * x;
    if (x < 1 / 2) return q;
    if (x < 2 / 3) return p + (q - p) * (2 / 3 - x) * 6;
    return p;
  };
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  return [
    hue2rgb(p, q, h + 1 / 3) * 255,
    hue2rgb(p, q, h) * 255,
    hue2rgb(p, q, h - 1 / 3) * 255,
  ];
}

function mixHex(a: string, b: string, amountB: number): string {
  const pa = parseHex(a);
  const pb = parseHex(b);
  const t = Math.max(0, Math.min(1, amountB));
  return toHex(
    pa.r * (1 - t) + pb.r * t,
    pa.g * (1 - t) + pb.g * t,
    pa.b * (1 - t) + pb.b * t,
  );
}

/**
 * Lighten / shift a brand hex until it meets contrast on a dark infographic surface.
 */
export function ensureContrastOnDark(
  fgHex: string,
  bgHex: string,
  minRatio: number,
): string {
  if (!fgHex?.startsWith("#")) return fgHex;
  let current = fgHex;
  if (contrastRatio(current, bgHex) >= minRatio) return current;

  const { r, g, b } = parseHex(current);
  let [h, s, l] = rgbToHsl(r, g, b);

  for (let i = 0; i < 28; i++) {
    l = Math.min(88, l + 4);
    s = Math.min(100, s + 2);
    const [nr, ng, nb] = hslToRgb(h, s, l);
    current = toHex(nr, ng, nb);
    if (contrastRatio(current, bgHex) >= minRatio) return current;
  }

  return mixHex(current, "#f1f5f9", 0.35);
}

export type InfographicTheme = {
  primary: string;
  secondary: string;
  accent: string;
  /** Large metric numerals — needs ≥3:1 on section cards in dark mode */
  metric: string;
  radius: string;
};

const DARK_SURFACE = "#0c1222";
const DARK_SURFACE_ALT = "#121a2e";

export function buildInfographicTheme(
  style: {
    primaryColor?: string;
    secondaryColor?: string;
    accentColor?: string;
    borderRadius?: string;
  } | undefined,
  isDark: boolean,
): InfographicTheme {
  const primary = style?.primaryColor || "#121042";
  const secondary = style?.secondaryColor || "#333333";
  const accent = style?.accentColor || "#fdbc2b";
  const radius = style?.borderRadius || "1.5rem";

  if (!isDark) {
    return { primary, secondary, accent, metric: primary, radius };
  }

  const primaryOnCard = ensureContrastOnDark(primary, DARK_SURFACE, 4.5);
  return {
    primary: primaryOnCard,
    secondary: ensureContrastOnDark(secondary, DARK_SURFACE_ALT, 4.5),
    accent: ensureContrastOnDark(accent, DARK_SURFACE_ALT, 3),
    metric: ensureContrastOnDark(primary, DARK_SURFACE_ALT, 3.5),
    radius,
  };
}
