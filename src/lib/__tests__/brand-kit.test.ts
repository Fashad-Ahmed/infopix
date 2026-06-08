import { describe, expect, it } from "vitest";
import {
  applyBrandStyle,
  createBrandKit,
  hasVisualOverrides,
  isLogoPlacement,
  isValidHexColor,
  isValidLogoDataUrl,
  parseBrandKits,
  sanitizeBrandKit,
  serializeBrandKits,
  MAX_LOGO_BYTES,
  type BrandKit,
} from "../brand-kit";
import type { BrandStyle } from "../../types/infographic";

const STYLE: BrandStyle = {
  primaryColor: "#0f172a",
  secondaryColor: "#f8f5ef",
  accentColor: "#f59e0b",
  fontMood: "modern-sans",
  borderRadius: "0.5rem",
  layoutDensity: "airy",
};

function tinyPngDataUrl(): string {
  // 1x1 transparent PNG, well under MAX_LOGO_BYTES
  const base64 =
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=";
  return `data:image/png;base64,${base64}`;
}

describe("isValidHexColor", () => {
  it("accepts 6-digit and 3-digit hex", () => {
    expect(isValidHexColor("#0f172a")).toBe(true);
    expect(isValidHexColor("#FFF")).toBe(true);
  });

  it("rejects malformed values", () => {
    expect(isValidHexColor("0f172a")).toBe(false);
    expect(isValidHexColor("#ggg")).toBe(false);
    expect(isValidHexColor("#1234")).toBe(false);
    expect(isValidHexColor(null)).toBe(false);
    expect(isValidHexColor(undefined)).toBe(false);
    expect(isValidHexColor(123)).toBe(false);
  });
});

describe("isValidLogoDataUrl", () => {
  it("accepts small image data URLs of supported mime types", () => {
    expect(isValidLogoDataUrl(tinyPngDataUrl())).toBe(true);
    expect(isValidLogoDataUrl("data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=")).toBe(true);
    expect(isValidLogoDataUrl("data:image/webp;base64,AAAA")).toBe(true);
  });

  it("rejects unsupported mime types and malformed strings", () => {
    expect(isValidLogoDataUrl("data:image/gif;base64,AAAA")).toBe(false);
    expect(isValidLogoDataUrl("data:application/pdf;base64,AAAA")).toBe(false);
    expect(isValidLogoDataUrl("https://example.com/logo.png")).toBe(false);
    expect(isValidLogoDataUrl("")).toBe(false);
    expect(isValidLogoDataUrl(null)).toBe(false);
    expect(isValidLogoDataUrl(42)).toBe(false);
  });

  it("rejects payloads larger than MAX_LOGO_BYTES", () => {
    // base64 length L encodes ~ (L * 3/4) bytes; build something past the cap
    const overSize = Math.ceil(((MAX_LOGO_BYTES + 1024) * 4) / 3);
    const huge = "A".repeat(overSize);
    expect(isValidLogoDataUrl(`data:image/png;base64,${huge}`)).toBe(false);
  });
});

describe("isLogoPlacement", () => {
  it("accepts known placements", () => {
    expect(isLogoPlacement("banner-left")).toBe(true);
    expect(isLogoPlacement("footer-right")).toBe(true);
    expect(isLogoPlacement("none")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isLogoPlacement("center")).toBe(false);
    expect(isLogoPlacement(null)).toBe(false);
    expect(isLogoPlacement(1)).toBe(false);
  });
});

describe("createBrandKit", () => {
  it("produces a usable empty kit with a trimmed name and unique id", () => {
    const a = createBrandKit("  Acme Corp  ");
    const b = createBrandKit("Acme Corp");
    expect(a.name).toBe("Acme Corp");
    expect(a.id).not.toBe(b.id);
    expect(a.logoDataUrl).toBeNull();
    expect(a.logoPlacement).toBe("banner-right");
    expect(hasVisualOverrides(a)).toBe(false);
  });

  it("falls back to a default name when blank", () => {
    expect(createBrandKit("   ").name).toBe("Untitled brand");
  });

  it("truncates very long names", () => {
    const kit = createBrandKit("x".repeat(200));
    expect(kit.name.length).toBe(60);
  });
});

describe("hasVisualOverrides", () => {
  const base = createBrandKit("Test");

  it("is false for an untouched kit", () => {
    expect(hasVisualOverrides(base)).toBe(false);
  });

  it("is true when any override field is set", () => {
    expect(hasVisualOverrides({ ...base, logoDataUrl: tinyPngDataUrl() })).toBe(true);
    expect(hasVisualOverrides({ ...base, primaryColor: "#000000" })).toBe(true);
    expect(hasVisualOverrides({ ...base, accentColor: "#ffffff" })).toBe(true);
    expect(hasVisualOverrides({ ...base, secondaryColor: "#ff00ff" })).toBe(true);
    expect(hasVisualOverrides({ ...base, footerText: "Acme Inc." })).toBe(true);
  });

  it("treats whitespace-only footer text as no override", () => {
    expect(hasVisualOverrides({ ...base, footerText: "   " })).toBe(false);
  });
});

describe("applyBrandStyle", () => {
  const base = createBrandKit("Test");

  it("returns the original style untouched when style is undefined", () => {
    expect(applyBrandStyle(undefined, base)).toBeUndefined();
  });

  it("returns generated colors unchanged when kit has no overrides", () => {
    expect(applyBrandStyle(STYLE, base)).toEqual(STYLE);
  });

  it("overrides only the fields the kit specifies", () => {
    const result = applyBrandStyle(STYLE, { ...base, primaryColor: "#111111" });
    expect(result).toEqual({ ...STYLE, primaryColor: "#111111" });
  });

  it("overrides multiple fields at once", () => {
    const result = applyBrandStyle(STYLE, {
      ...base,
      primaryColor: "#111111",
      accentColor: "#222222",
      secondaryColor: "#333333",
    });
    expect(result).toEqual({
      ...STYLE,
      primaryColor: "#111111",
      accentColor: "#222222",
      secondaryColor: "#333333",
    });
  });

  it("ignores invalid hex overrides and keeps the generated value", () => {
    const result = applyBrandStyle(STYLE, { ...base, primaryColor: "not-a-color" as string });
    expect(result?.primaryColor).toBe(STYLE.primaryColor);
  });

  it("does not mutate the original style object", () => {
    const original = { ...STYLE };
    applyBrandStyle(STYLE, { ...base, primaryColor: "#111111" });
    expect(STYLE).toEqual(original);
  });
});

describe("sanitizeBrandKit", () => {
  const valid: BrandKit = {
    id: "brand-abc123",
    name: "Acme",
    logoDataUrl: tinyPngDataUrl(),
    logoPlacement: "footer-left",
    primaryColor: "#0f172a",
    accentColor: "#f59e0b",
    secondaryColor: "#f8f5ef",
    footerText: "Acme Inc.",
  };

  it("round-trips a fully valid kit", () => {
    expect(sanitizeBrandKit(valid)).toEqual(valid);
  });

  it("rejects non-objects and missing required fields", () => {
    expect(sanitizeBrandKit(null)).toBeNull();
    expect(sanitizeBrandKit(undefined)).toBeNull();
    expect(sanitizeBrandKit("string")).toBeNull();
    expect(sanitizeBrandKit({})).toBeNull();
    expect(sanitizeBrandKit({ id: "x" })).toBeNull();
    expect(sanitizeBrandKit({ id: "", name: "Acme" })).toBeNull();
    expect(sanitizeBrandKit({ id: "x", name: "   " })).toBeNull();
  });

  it("repairs/drops individual bad optional fields instead of rejecting the record", () => {
    const sanitized = sanitizeBrandKit({
      id: "brand-1",
      name: "Acme",
      logoDataUrl: "not-a-data-url",
      logoPlacement: "diagonal",
      primaryColor: "blue",
      accentColor: 42,
      secondaryColor: null,
      footerText: "   ",
    });
    expect(sanitized).toEqual({
      id: "brand-1",
      name: "Acme",
      logoDataUrl: null,
      logoPlacement: "banner-right",
      primaryColor: null,
      accentColor: null,
      secondaryColor: null,
      footerText: null,
    });
  });

  it("trims and truncates name and footer text", () => {
    const sanitized = sanitizeBrandKit({
      id: "brand-1",
      name: "  Acme  ",
      logoDataUrl: null,
      logoPlacement: "none",
      primaryColor: null,
      accentColor: null,
      secondaryColor: null,
      footerText: "y".repeat(200),
    });
    expect(sanitized?.name).toBe("Acme");
    expect(sanitized?.footerText?.length).toBe(80);
  });
});

describe("serializeBrandKits / parseBrandKits", () => {
  const kits: BrandKit[] = [createBrandKit("Acme"), createBrandKit("Globex")];

  it("round-trips a list of valid kits", () => {
    const json = serializeBrandKits(kits);
    expect(parseBrandKits(json)).toEqual(kits);
  });

  it("returns an empty list for null/empty/malformed input", () => {
    expect(parseBrandKits(null)).toEqual([]);
    expect(parseBrandKits(undefined)).toEqual([]);
    expect(parseBrandKits("")).toEqual([]);
    expect(parseBrandKits("{not json")).toEqual([]);
    expect(parseBrandKits("{}")).toEqual([]);
    expect(parseBrandKits("[1, 2, 3]")).toEqual([]);
  });

  it("drops invalid entries but keeps valid ones from a mixed array", () => {
    const json = JSON.stringify([kits[0], { bad: true }, kits[1], null, "nope"]);
    expect(parseBrandKits(json)).toEqual([kits[0], kits[1]]);
  });
});
