import { createTool } from "@mastra/core/tools";
import { z } from "zod";
import * as cheerio from "cheerio";

export const scrapeWebsiteTool = createTool({
  id: "scrape-website",
  description:
    "Fetches the main text content from a given URL. Use this when the user provides a link instead of raw text.",
  inputSchema: z.object({
    url: z.string().url(),
  }),

  execute: async ({ url }) => {
    try {
      const response = await fetch(url, {
        headers: {
          // Identify as a real browser to bypass simple bot filters
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
          Accept:
            "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        },
      });

      if (!response.ok) {
        return {
          error: `HTTP Error: ${response.status} - ${response.statusText}`,
        };
      }

      const html = await response.text();
      const $ = cheerio.load(html);

      // Senior Tip: If the text is still empty, the site might be a Single Page App (SPA).
      // For the demo, ensure you target a simpler static documentation page.
      $("script, style, nav, footer, header").remove();
      const cleanText = $("body").text().replace(/\s+/g, " ").trim();

      return { text: cleanText.substring(0, 15000) };
    } catch (error) {
      return {
        error: `Scraping failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});
