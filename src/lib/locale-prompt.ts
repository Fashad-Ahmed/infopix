export type SupportedLocale = "en" | "it";

const SUPPORTED_LOCALES = new Set<string>(["en", "it"]);

/**
 * Parse the `locale` cookie from a raw Cookie header value.
 * Falls back to "en" for any unknown or missing value.
 */
export function parseLocaleCookie(cookieHeader: string | null | undefined): SupportedLocale {
  if (!cookieHeader) return "en";
  const match = cookieHeader.match(/(?:^|;\s*)locale=([^;]+)/);
  if (!match) return "en";
  const value = match[1].trim();
  return SUPPORTED_LOCALES.has(value) ? (value as SupportedLocale) : "en";
}

/**
 * Returns a language directive to append to any LLM prompt that produces
 * user-visible text. Returns an empty string for English (the default).
 */
export function getLanguageDirective(locale: SupportedLocale): string {
  if (locale === "it") {
    return (
      "\n\nIMPORTANT: Write ALL user-visible text — titles, headings, summaries, " +
      "labels, insights, bullet points, and any other content fields — in Italian. " +
      "Do not use English for any output field."
    );
  }
  return "";
}
