import type { CSSProperties } from "react";

/** Maps Brand Visionary `vibe` / legacy `fontMood` to CSS font stacks. */
export type BrandVibe =
  | "corporate"
  | "modern"
  | "playful"
  | "cyberpunk"
  | "editorial"
  | "monospaced";

const VIBE_ALIASES: Record<string, BrandVibe> = {
  corporate: "corporate",
  "modern-sans": "modern",
  modern: "modern",
  playful: "playful",
  cyberpunk: "cyberpunk",
  editorial: "editorial",
  monospaced: "monospaced",
};

export function resolveBrandVibe(style?: {
  vibe?: string;
  fontMood?: string;
}): BrandVibe {
  const raw = (style?.vibe ?? style?.fontMood ?? "modern").toLowerCase();
  return VIBE_ALIASES[raw] ?? "modern";
}

export function fontFamilyForVibe(vibe: BrandVibe): string {
  switch (vibe) {
    case "corporate":
    case "editorial":
      return "var(--font-brand-serif), Georgia, 'Times New Roman', serif";
    case "cyberpunk":
    case "monospaced":
      return "var(--font-geist-mono), ui-monospace, monospace";
    case "playful":
      return "var(--font-brand-display), var(--font-geist-sans), system-ui, sans-serif";
    case "modern":
    default:
      return "var(--font-geist-sans), system-ui, sans-serif";
  }
}

export function infographicFontStyles(style?: {
  vibe?: string;
  fontMood?: string;
}): CSSProperties {
  const vibe = resolveBrandVibe(style);
  const family = fontFamilyForVibe(vibe);
  const base: CSSProperties = { fontFamily: family };

  if (vibe === "playful") {
    return { ...base, letterSpacing: "-0.01em" };
  }
  if (vibe === "corporate") {
    return { ...base, letterSpacing: "0.01em" };
  }
  if (vibe === "cyberpunk") {
    return { ...base, letterSpacing: "0.04em" };
  }
  if (vibe === "editorial") {
    return { ...base, letterSpacing: "0.02em" };
  }
  return base;
}
