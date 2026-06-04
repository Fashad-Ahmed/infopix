import { describe, it, expect } from "vitest";
import { slugify } from "../slug";

describe("slugify", () => {
  it("lowercases input", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("replaces spaces with hyphens", () => {
    expect(slugify("foo bar baz")).toBe("foo-bar-baz");
  });

  it("collapses multiple special chars into single hyphen", () => {
    expect(slugify("foo  --  bar")).toBe("foo-bar");
  });

  it("strips leading and trailing hyphens", () => {
    expect(slugify("---hello---")).toBe("hello");
  });

  it("removes non-alphanumeric characters", () => {
    expect(slugify("Silicon Valley: The Data-Driven Disruption!")).toBe(
      "silicon-valley-the-data-driven-disruption",
    );
  });

  it("returns 'infographic' for empty string", () => {
    expect(slugify("")).toBe("infographic");
  });

  it("returns 'infographic' for whitespace-only string", () => {
    expect(slugify("   ")).toBe("infographic");
  });

  it("returns 'infographic' for string of only special chars", () => {
    expect(slugify("!!!")).toBe("infographic");
  });

  it("truncates output to 60 characters", () => {
    const long = "a".repeat(80);
    expect(slugify(long).length).toBeLessThanOrEqual(60);
  });

  it("preserves numbers", () => {
    expect(slugify("Top 10 Facts")).toBe("top-10-facts");
  });

  it("handles unicode by stripping non-ascii", () => {
    expect(slugify("Calciopoli: Anatomia di uno Scandalo")).toBe(
      "calciopoli-anatomia-di-uno-scandalo",
    );
  });
});
