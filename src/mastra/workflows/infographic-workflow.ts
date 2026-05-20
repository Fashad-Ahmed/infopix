import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import * as cheerio from "cheerio";
import {
  contentAgent,
  styleAgent,
  criticAgent,
  formatterAgent,
} from "../agents/infographic-agent";
import {
  InfographicInputSchema,
  InfographicContentSchema,
  BrandStyleSchema,
  ReviewOutputSchema,
  FinalPayloadSchema,
} from "../schemas/schema";

// Extract the Content

const extractContentStep = createStep({
  id: "extract-content",
  inputSchema: InfographicInputSchema,
  outputSchema: InfographicContentSchema,

  execute: async ({ inputData }) => {
    // PHASE 1: RESEARCH
    // Bypass LLM tool-calling (unreliable on Groq) — fetch URL directly.
    // If Jina-proxied, unwrap and fetch the original URL to avoid Jina blocking
    // hosts like raw.githubusercontent.com.
    let researchedText: string;
    if (inputData.rawText.startsWith("http")) {
      const JINA_PREFIX = "https://r.jina.ai/";
      const targetUrl = inputData.rawText.startsWith(JINA_PREFIX)
        ? inputData.rawText.slice(JINA_PREFIX.length)
        : inputData.rawText;
      const jinaUrl = `${JINA_PREFIX}${targetUrl}`;

      const BROWSER_UA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

      // 1st attempt: direct fetch (fast, works for plain-text URLs like pastebin)
      const directRes = await fetch(targetUrl, {
        headers: { "User-Agent": BROWSER_UA, Accept: "text/html,text/plain,*/*" },
      }).catch(() => null);

      if (directRes?.ok) {
        const raw = await directRes.text();
        const ct = directRes.headers.get("content-type") ?? "";
        if (ct.includes("text/html")) {
          const $ = cheerio.load(raw);
          $("script, style, nav, footer, header").remove();
          researchedText = $("body").text().replace(/\s+/g, " ").trim().slice(0, 15000);
        } else {
          researchedText = raw.slice(0, 15000);
        }
      } else {
        // 2nd attempt: Jina AI reader — handles JS-heavy pages and bypasses some blocks
        console.log(`[extract-content] Direct fetch failed, trying Jina: ${jinaUrl}`);
        const jinaRes = await fetch(jinaUrl, {
          headers: { "User-Agent": BROWSER_UA, Accept: "text/plain,*/*", "X-Return-Format": "text" },
        });
        if (!jinaRes.ok) {
          throw new Error(
            `Unable to fetch content. Direct: ${directRes?.status ?? "network error"}, Jina: ${jinaRes.status}. Check the URL is publicly accessible.`,
          );
        }
        const jinaText = await jinaRes.text();
        const trimmed = jinaText.trim();
        // Detect Jina error responses: short body or known error phrases
        const ERROR_SIGNALS = [
          "URL SOURCE NOT FOUND",
          "404: Not Found",
          "403: Forbidden",
          "Error 4",
          "Not Found",
          "Access Denied",
        ];
        const looksLikeError =
          trimmed.length < 300 || ERROR_SIGNALS.some((s) => trimmed.includes(s));
        if (looksLikeError) {
          throw new Error(
            `URL is not accessible (${targetUrl}). Check the URL exists and is publicly reachable.`,
          );
        }
        researchedText = jinaText.slice(0, 15000);
      }
    } else {
      researchedText = inputData.rawText;
    }

    // Summarise with LLM only when raw text is long
    let summarisedText = researchedText;
    if (researchedText.length > 3000) {
      const summarisePrompt = `
You are an expert data extractor. Summarise the following content.

CRITICAL INSTRUCTIONS:
1. Do NOT output raw HTML, CSS, script tags, or long code blocks.
2. Extract ONLY the core narrative, key features, statistical metrics, and architectural takeaways.
3. Compress into a clean, readable format of UNDER 1000 words.
4. Do not lose critical numbers or brand facts.

Content:
${researchedText}
      `.trim();
      const summaryRes = await contentAgent.generate(summarisePrompt);
      summarisedText = summaryRes.text;
    }

    // PHASE 2: FORMATTING
    const formatPrompt = `
Format this researched data into the final infographic schema.
Density: ${inputData.density}
Focus: ${inputData.narrativeFocus}

Section rules (must match schema exactly):
- type "metric": heading, value (string), insight; optional unit, trend, subheading.
- type "comparison": heading, items (2-4 objects with label, value number 0-100, isHighlight boolean).
- type "takeaway": heading, points (2-3 short strings).

Include metadata.confidenceScore (0-1) and metadata.reasoning.

Raw Research Data: ${summarisedText}
`;

    const formatRes = await formatterAgent.generate(formatPrompt, {
      structuredOutput: {
        schema: InfographicContentSchema,
        // Groq and similar models often need JSON-in-prompt coercion for strict shapes.
        jsonPromptInjection: true,
      },
    });

    let object = formatRes.object;
    if (!object && formatRes.text) {
      try {
        const cleaned = formatRes.text
          .replace(/```json/gi, "")
          .replace(/```/g, "")
          .trim();
        object = JSON.parse(cleaned) as typeof object;
      } catch {
        /* fall through */
      }
    }
    if (!object) {
      console.error("Formatter structured output missing:", formatRes.text);
      throw new Error("Formatter agent returned no structured content.");
    }

    return InfographicContentSchema.parse(object);
  },
});

// Extract the Style

const extractStyleStep = createStep({
  id: "extract-style",
  inputSchema: z.any(), // Accepts the chain flow
  outputSchema: BrandStyleSchema,
  execute: async ({ getInitData }) => {
    // Grab the original trigger data from the start of the workflow
    const inputData = getInitData() as z.infer<typeof InfographicInputSchema>;

    if (!inputData.referenceImageBase64) {
      return {
        primaryColor: "#0f172a",
        secondaryColor: "#3b82f6",
        accentColor: "#f59e0b",
        fontMood: "modern-sans",
        borderRadius: "0.5rem",
        layoutDensity: "airy",
      } as z.infer<typeof BrandStyleSchema>;
    }

    const res = await styleAgent.generate(
      [
        { type: "text", text: "Extract the brand design system." },
        {
          type: "image",
          image: new URL(
            `data:image/jpeg;base64,${inputData.referenceImageBase64}`,
          ),
        },
      ],
      {
        structuredOutput: { schema: BrandStyleSchema },
      },
    );

    const fallback: z.infer<typeof BrandStyleSchema> = {
      primaryColor: "#0f172a",
      secondaryColor: "#3b82f6",
      accentColor: "#f59e0b",
      fontMood: "modern-sans",
      borderRadius: "0.5rem",
      layoutDensity: "airy",
    };
    return res.object ?? fallback;
  },
});

// QA Review

const reviewDraftStep = createStep({
  id: "review-draft",

  inputSchema: z.any(),

  outputSchema: ReviewOutputSchema,

  execute: async ({ getInitData, getStepResult }) => {
    const inputData = getInitData() as z.infer<typeof InfographicInputSchema>;
    const rawData = inputData.rawText ?? "";

    const draftedJson = getStepResult("extract-content") as z.infer<
      typeof InfographicContentSchema
    > | null;

    const criticPrompt = `
Review the drafted infographic data against the original raw text.

Original Text:
${rawData}

Drafted JSON:
${JSON.stringify(draftedJson ?? {}, null, 2)}

CRITICAL INSTRUCTIONS:
- Output ONLY valid raw JSON
- No markdown
- No explanations

Required format:
{
  "isAccurate": boolean,
  "feedback": "Leave empty if accurate, otherwise explain what is wrong."
}
`;

    const criticRes = await criticAgent.generate(criticPrompt);

    try {
      const cleanJsonString = criticRes.text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const parsedData = JSON.parse(cleanJsonString);

      return ReviewOutputSchema.parse({
        isAccurate: Boolean(parsedData.isAccurate),
        feedback: parsedData.feedback ?? "",
      });
    } catch {
      return {
        isAccurate: false,
        feedback: "Critic agent failed to return valid JSON.",
      };
    }
  },
});

const assembleFinalPayloadStep = createStep({
  id: "assemble-payload",
  inputSchema: z.any(),
  outputSchema: FinalPayloadSchema,
  execute: async ({ getStepResult }) => {
    const styleData = getStepResult("extract-style") as z.infer<
      typeof BrandStyleSchema
    >;
    const contentData = getStepResult("extract-content") as z.infer<
      typeof InfographicContentSchema
    >;
    const reviewData = getStepResult("review-draft") as z.infer<
      typeof ReviewOutputSchema
    >;

    return FinalPayloadSchema.parse({
      content: contentData,
      style: styleData,
      qaReport: reviewData,
    });
  },
});

export const infographicWorkflow = createWorkflow({
  id: "infographic-orchestrator",
  inputSchema: InfographicInputSchema,
  outputSchema: FinalPayloadSchema,
})
  .then(extractContentStep)
  .then(extractStyleStep)
  .then(reviewDraftStep)
  .then(assembleFinalPayloadStep)
  .commit();
