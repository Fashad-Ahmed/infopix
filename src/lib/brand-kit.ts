import type { BrandStyle } from "../types/infographic";

export type LogoPlacement = "banner-left" | "banner-right" | "footer-left" | "footer-right" | "none";

export const LOGO_PLACEMENTS: readonly LogoPlacement[] = [
  "banner-left",
  "banner-right",
  "footer-left",
  "footer-right",
  "none",
];

export type BrandKit = {
  id: string;
  name: string;
  logoDataUrl: string | null;
  logoPlacement: LogoPlacement;
  primaryColor: string | null;
  accentColor: string | null;
  secondaryColor: string | null;
  footerText: string | null;
};

export const MAX_LOGO_BYTES = 600 * 1024;

const HEX_COLOR_PATTERN = /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/;
const LOGO_DATA_URL_PATTERN = /^data:image\/(png|jpe?g|svg\+xml|webp);base64,([A-Za-z0-9+/]+=*)$/;

export function isValidHexColor(value: unknown): value is string {
  return typeof value === "string" && HEX_COLOR_PATTERN.test(value);
}

export function isValidLogoDataUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  const match = LOGO_DATA_URL_PATTERN.exec(value);
  if (!match) return false;
  // base64 payload size in bytes ≈ (length * 3/4) minus padding
  const payload = match[2];
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  const bytes = (payload.length * 3) / 4 - padding;
  return bytes <= MAX_LOGO_BYTES;
}

export function isLogoPlacement(value: unknown): value is LogoPlacement {
  return typeof value === "string" && (LOGO_PLACEMENTS as readonly string[]).includes(value);
}

function generateId(): string {
  return `brand-${Math.random().toString(36).slice(2, 10)}-${Date.now().toString(36)}`;
}

export function createBrandKit(name: string): BrandKit {
  return {
    id: generateId(),
    name: name.trim().slice(0, 60) || "Untitled brand",
    logoDataUrl: null,
    logoPlacement: "banner-right",
    primaryColor: null,
    accentColor: null,
    secondaryColor: null,
    footerText: null,
  };
}

/** True when the kit would change anything visually if applied. */
export function hasVisualOverrides(kit: BrandKit): boolean {
  return (
    kit.logoDataUrl !== null ||
    kit.primaryColor !== null ||
    kit.accentColor !== null ||
    kit.secondaryColor !== null ||
    (kit.footerText !== null && kit.footerText.trim().length > 0)
  );
}

/**
 * Overlay brand-kit color overrides onto a generated style. Null/invalid override
 * fields fall through to the generated value — the kit never has to be "complete".
 */
export function applyBrandStyle(style: BrandStyle | undefined, kit: BrandKit): BrandStyle | undefined {
  if (!style) return style;
  return {
    ...style,
    primaryColor: isValidHexColor(kit.primaryColor) ? kit.primaryColor : style.primaryColor,
    accentColor: isValidHexColor(kit.accentColor) ? kit.accentColor : style.accentColor,
    secondaryColor: isValidHexColor(kit.secondaryColor) ? kit.secondaryColor : style.secondaryColor,
  };
}

/**
 * Validate and coerce an unknown value (e.g. parsed from localStorage JSON) into
 * a BrandKit. Returns null if the shape is unsalvageable; drops/repairs individual
 * bad fields rather than rejecting the whole record where it's safe to do so.
 */
export function sanitizeBrandKit(value: unknown): BrandKit | null {
  if (!value || typeof value !== "object") return null;
  const v = value as Record<string, unknown>;

  if (typeof v.id !== "string" || !v.id) return null;
  if (typeof v.name !== "string" || !v.name.trim()) return null;

  const logoDataUrl = isValidLogoDataUrl(v.logoDataUrl) ? v.logoDataUrl : null;
  const logoPlacement = isLogoPlacement(v.logoPlacement) ? v.logoPlacement : "banner-right";
  const primaryColor = isValidHexColor(v.primaryColor) ? v.primaryColor : null;
  const accentColor = isValidHexColor(v.accentColor) ? v.accentColor : null;
  const secondaryColor = isValidHexColor(v.secondaryColor) ? v.secondaryColor : null;
  const footerText =
    typeof v.footerText === "string" && v.footerText.trim().length > 0
      ? v.footerText.slice(0, 80)
      : null;

  return {
    id: v.id,
    name: v.name.trim().slice(0, 60),
    logoDataUrl,
    logoPlacement,
    primaryColor,
    accentColor,
    secondaryColor,
    footerText,
  };
}

export function serializeBrandKits(kits: readonly BrandKit[]): string {
  return JSON.stringify(kits);
}

/** Safe parse — malformed JSON or non-array input yields an empty list, bad entries are dropped. */
export function parseBrandKits(raw: string | null | undefined): BrandKit[] {
  if (!raw) return [];
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(parsed)) return [];
  const result: BrandKit[] = [];
  for (const entry of parsed) {
    const kit = sanitizeBrandKit(entry);
    if (kit) result.push(kit);
  }
  return result;
}
