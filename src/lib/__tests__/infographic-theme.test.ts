import { describe, it, expect } from "vitest";
import {
  buildInfographicTheme,
  ensureContrastOnDark,
} from "../infographic-theme";

const STYLE = {
  primaryColor: "#121042",
  secondaryColor: "#333333",
  accentColor: "#fdbc2b",
  borderRadius: "1.5rem",
};

describe("buildInfographicTheme — light mode", () => {
  it("always locks primary to brand midnight indigo", () => {
    const t = buildInfographicTheme(STYLE, false);
    expect(t.primary).toBe("#121042");
  });

  it("ignores AI primaryColor for primary slot", () => {
    const t = buildInfographicTheme({ primaryColor: "#ff6600" }, false);
    expect(t.primary).toBe("#121042");
  });

  it("maps AI primaryColor to accent slot", () => {
    const t = buildInfographicTheme({ primaryColor: "#ff6600" }, false);
    expect(t.accent).toBe("#ff6600");
  });

  it("passes secondary through unchanged", () => {
    const t = buildInfographicTheme(STYLE, false);
    expect(t.secondary).toBe(STYLE.secondaryColor);
  });

  it("uses accentColor as accent when no primaryColor provided", () => {
    const t = buildInfographicTheme({ accentColor: "#fdbc2b" }, false);
    expect(t.accent).toBe("#fdbc2b");
  });

  it("passes radius through unchanged", () => {
    const t = buildInfographicTheme(STYLE, false);
    expect(t.radius).toBe(STYLE.borderRadius);
  });

  it("metric equals primary in light mode", () => {
    const t = buildInfographicTheme(STYLE, false);
    expect(t.metric).toBe(t.primary);
  });

  it("primary is midnight indigo even when style is empty", () => {
    const t = buildInfographicTheme({}, false);
    expect(t.primary).toBe("#121042");
  });

  it("falls back to brand amber when accentColor missing", () => {
    const t = buildInfographicTheme({}, false);
    expect(t.accent).toBe("#fdbc2b");
  });

  it("falls back to 1.5rem radius when borderRadius missing", () => {
    const t = buildInfographicTheme({}, false);
    expect(t.radius).toBe("1.5rem");
  });

  it("falls back to neutral-700 when secondaryColor missing", () => {
    const t = buildInfographicTheme({}, false);
    expect(t.secondary).toBe("#333333");
  });

  it("handles undefined style object", () => {
    const t = buildInfographicTheme(undefined, false);
    expect(t.primary).toBe("#121042");
    expect(t.radius).toBe("1.5rem");
  });
});

describe("buildInfographicTheme — dark mode", () => {
  it("returns theme object with all required keys", () => {
    const t = buildInfographicTheme(STYLE, true);
    expect(t).toHaveProperty("primary");
    expect(t).toHaveProperty("secondary");
    expect(t).toHaveProperty("accent");
    expect(t).toHaveProperty("metric");
    expect(t).toHaveProperty("radius");
  });

  it("radius unchanged in dark mode", () => {
    const t = buildInfographicTheme(STYLE, true);
    expect(t.radius).toBe(STYLE.borderRadius);
  });

  it("dark primary meets 4.5:1 contrast on dark surface", () => {
    const t = buildInfographicTheme({ primaryColor: "#121042" }, true);
    const ratio = contrastRatio(t.primary, "#0c1222");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("dark accent meets 3:1 contrast on dark surface alt", () => {
    const t = buildInfographicTheme({ accentColor: "#fdbc2b" }, true);
    const ratio = contrastRatio(t.accent, "#121a2e");
    expect(ratio).toBeGreaterThanOrEqual(3);
  });

  it("dark metric meets 3.5:1 contrast on dark surface alt", () => {
    const t = buildInfographicTheme({ primaryColor: "#121042" }, true);
    const ratio = contrastRatio(t.metric, "#121a2e");
    expect(ratio).toBeGreaterThanOrEqual(3.5);
  });
});

describe("ensureContrastOnDark", () => {
  it("returns input unchanged when contrast already sufficient", () => {
    const result = ensureContrastOnDark("#ffffff", "#0c1222", 4.5);
    expect(result).toBe("#ffffff");
  });

  it("lightens dark color until it meets min ratio", () => {
    const result = ensureContrastOnDark("#121042", "#0c1222", 4.5);
    const ratio = contrastRatio(result, "#0c1222");
    expect(ratio).toBeGreaterThanOrEqual(4.5);
  });

  it("returns input unchanged for non-hex values", () => {
    expect(ensureContrastOnDark("var(--primary)", "#000000", 4.5)).toBe(
      "var(--primary)",
    );
  });

  it("handles already-light colors without mutation", () => {
    const light = "#f8f7f3";
    const result = ensureContrastOnDark(light, "#0c1222", 4.5);
    expect(result).toBe(light);
  });
});

function luminance(hex: string): number {
  const raw = hex.replace("#", "").slice(0, 6);
  const r = parseInt(raw.slice(0, 2), 16);
  const g = parseInt(raw.slice(2, 4), 16);
  const b = parseInt(raw.slice(4, 6), 16);
  const lin = (c: number) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

function contrastRatio(fg: string, bg: string): number {
  const l1 = luminance(fg);
  const l2 = luminance(bg);
  return (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
}
