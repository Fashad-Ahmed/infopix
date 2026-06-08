import { describe, it, expect } from "vitest";
import {
  createDesignKit,
  hasDesignOverrides,
  applyDesignOverrides,
  isFontOption,
  isAccentStyleOption,
  FONT_OPTIONS,
  ACCENT_STYLE_OPTIONS,
} from "../design-kit";

describe("isFontOption", () => {
  it("accepts known font values", () => {
    for (const { value } of FONT_OPTIONS) expect(isFontOption(value)).toBe(true);
  });
  it("rejects unknown or non-string values", () => {
    expect(isFontOption("comic-sans")).toBe(false);
    expect(isFontOption(null)).toBe(false);
    expect(isFontOption(42)).toBe(false);
  });
});

describe("isAccentStyleOption", () => {
  it("accepts known accent values", () => {
    for (const { value } of ACCENT_STYLE_OPTIONS) expect(isAccentStyleOption(value)).toBe(true);
  });
  it("rejects unknown or non-string values", () => {
    expect(isAccentStyleOption("glow")).toBe(false);
    expect(isAccentStyleOption(undefined)).toBe(false);
  });
});

describe("createDesignKit", () => {
  it("starts with no overrides", () => {
    const kit = createDesignKit();
    expect(kit.primaryFont).toBeNull();
    expect(kit.accentStyle).toBeNull();
    expect(hasDesignOverrides(kit)).toBe(false);
  });
});

describe("hasDesignOverrides", () => {
  it("is true when either field is set", () => {
    expect(hasDesignOverrides({ primaryFont: "slab", accentStyle: null })).toBe(true);
    expect(hasDesignOverrides({ primaryFont: null, accentStyle: "stamp" })).toBe(true);
    expect(hasDesignOverrides({ primaryFont: "slab", accentStyle: "stamp" })).toBe(true);
  });
  it("is false when both are null", () => {
    expect(hasDesignOverrides({ primaryFont: null, accentStyle: null })).toBe(false);
  });
});

describe("applyDesignOverrides", () => {
  const generated = { primaryFont: "modern-sans", accentStyle: "rule", template: "editorial-portrait" };

  it("passes the config through untouched when kit is inactive", () => {
    const result = applyDesignOverrides(generated, createDesignKit());
    expect(result).toBe(generated);
  });

  it("overrides only the font when accentStyle is null", () => {
    const result = applyDesignOverrides(generated, { primaryFont: "slab", accentStyle: null });
    expect(result.primaryFont).toBe("slab");
    expect(result.accentStyle).toBe("rule");
    expect(result.template).toBe("editorial-portrait");
  });

  it("overrides only the accent style when font is null", () => {
    const result = applyDesignOverrides(generated, { primaryFont: null, accentStyle: "stamp" });
    expect(result.primaryFont).toBe("modern-sans");
    expect(result.accentStyle).toBe("stamp");
  });

  it("overrides both fields when both are set", () => {
    const result = applyDesignOverrides(generated, { primaryFont: "display-serif", accentStyle: "ribbon" });
    expect(result.primaryFont).toBe("display-serif");
    expect(result.accentStyle).toBe("ribbon");
  });

  it("does not mutate the source config", () => {
    const before = { ...generated };
    applyDesignOverrides(generated, { primaryFont: "slab", accentStyle: "stamp" });
    expect(generated).toEqual(before);
  });
});
