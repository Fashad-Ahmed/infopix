import { describe, it, expect } from "vitest";
import { parseLocaleCookie, getLanguageDirective } from "../locale-prompt";

describe("parseLocaleCookie", () => {
  it("returns 'en' when cookie header is null", () => {
    expect(parseLocaleCookie(null)).toBe("en");
  });

  it("returns 'en' when cookie header is undefined", () => {
    expect(parseLocaleCookie(undefined)).toBe("en");
  });

  it("returns 'en' when cookie header is empty string", () => {
    expect(parseLocaleCookie("")).toBe("en");
  });

  it("returns 'en' when no locale cookie is present", () => {
    expect(parseLocaleCookie("theme=dark; session=abc123")).toBe("en");
  });

  it("returns 'en' when locale cookie is 'en'", () => {
    expect(parseLocaleCookie("locale=en")).toBe("en");
  });

  it("returns 'it' when locale cookie is 'it'", () => {
    expect(parseLocaleCookie("locale=it")).toBe("it");
  });

  it("returns 'it' when locale is among other cookies", () => {
    expect(parseLocaleCookie("theme=dark; locale=it; session=xyz")).toBe("it");
  });

  it("returns 'en' for unsupported locale value", () => {
    expect(parseLocaleCookie("locale=fr")).toBe("en");
  });

  it("returns 'en' for malformed locale value", () => {
    expect(parseLocaleCookie("locale=")).toBe("en");
  });

  it("parses locale when it is the first cookie", () => {
    expect(parseLocaleCookie("locale=it; other=value")).toBe("it");
  });

  it("parses locale when it is the last cookie", () => {
    expect(parseLocaleCookie("other=value; locale=it")).toBe("it");
  });
});

describe("getLanguageDirective", () => {
  it("returns empty string for 'en'", () => {
    expect(getLanguageDirective("en")).toBe("");
  });

  it("returns Italian instruction for 'it'", () => {
    const directive = getLanguageDirective("it");
    expect(directive).toContain("Italian");
    expect(directive).toContain("Do not use English");
  });

  it("Italian directive is non-empty", () => {
    expect(getLanguageDirective("it").length).toBeGreaterThan(0);
  });

  it("English directive does not mention Italian", () => {
    expect(getLanguageDirective("en")).not.toContain("Italian");
  });
});
