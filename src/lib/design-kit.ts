// Pure overlay logic for live typography/accent overrides on a generated infographic.
// Mirrors brand-kit.ts: a small draft object that, when active, overrides fields
// on the generated studioConfig without mutating the source data.

export type FontOption = "condensed-sans" | "slab" | "modern-sans" | "display-serif";
export const FONT_OPTIONS: ReadonlyArray<{ value: FontOption; label: string }> = [
  { value: "modern-sans", label: "Modern sans" },
  { value: "condensed-sans", label: "Condensed" },
  { value: "slab", label: "Slab serif" },
  { value: "display-serif", label: "Display serif" },
];

export type AccentStyleOption = "rule" | "ribbon" | "stamp" | "none";
export const ACCENT_STYLE_OPTIONS: ReadonlyArray<{ value: AccentStyleOption; label: string }> = [
  { value: "rule", label: "Underline" },
  { value: "ribbon", label: "Ribbon" },
  { value: "stamp", label: "Stamp" },
  { value: "none", label: "None" },
];

const FONT_VALUES = new Set<FontOption>(FONT_OPTIONS.map((o) => o.value));
const ACCENT_VALUES = new Set<AccentStyleOption>(ACCENT_STYLE_OPTIONS.map((o) => o.value));

export function isFontOption(value: unknown): value is FontOption {
  return typeof value === "string" && FONT_VALUES.has(value as FontOption);
}

export function isAccentStyleOption(value: unknown): value is AccentStyleOption {
  return typeof value === "string" && ACCENT_VALUES.has(value as AccentStyleOption);
}

export type DesignKit = {
  primaryFont: FontOption | null;
  accentStyle: AccentStyleOption | null;
};

export function createDesignKit(): DesignKit {
  return { primaryFont: null, accentStyle: null };
}

export function hasDesignOverrides(kit: DesignKit): boolean {
  return kit.primaryFont !== null || kit.accentStyle !== null;
}

type StudioConfigLike = {
  primaryFont: string;
  accentStyle: string;
  [key: string]: unknown;
};

/**
 * Layers design-kit overrides on top of a generated studioConfig.
 * Null fields fall through to the generated value untouched.
 */
export function applyDesignOverrides<T extends StudioConfigLike>(config: T, kit: DesignKit): T {
  if (!hasDesignOverrides(kit)) return config;
  return {
    ...config,
    primaryFont: kit.primaryFont ?? config.primaryFont,
    accentStyle: kit.accentStyle ?? config.accentStyle,
  };
}
