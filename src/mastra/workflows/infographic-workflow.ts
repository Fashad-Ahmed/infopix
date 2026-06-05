import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import * as cheerio from "cheerio";
import { getLanguageDirective } from "../../lib/locale-prompt";
import {
  contentAgent,
  styleAgent,
  styleAgentFallback,
  styleFromTextAgent,
  criticAgent,
  formatterAgent,
  topicContentAgent,
  topicContentAgentFallback,
} from "../agents/infographic-agent";
import { withFallback } from "../utils/with-fallback";
import {
  InfographicInputSchema,
  InfographicContentSchema,
  BrandStyleSchema,
  ReviewOutputSchema,
  FinalPayloadSchema,
  COLOR_SCHEME_PRESETS,
} from "../schemas/schema";
import { generateImage } from "../tools/image-generator";

// Truncates AI output to schema limits before Zod parsing
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function sanitizeContent(obj: any): any {
  if (!obj || typeof obj !== "object") return obj;
  const o = { ...obj };
  if (typeof o.title === "string") o.title = o.title.slice(0, 120);
  if (typeof o.summary === "string") o.summary = o.summary.slice(0, 500);
  if (typeof o.heroImagePrompt === "string") o.heroImagePrompt = o.heroImagePrompt.slice(0, 400);
  if (Array.isArray(o.sections)) {
    const CHART_SUBTYPES = new Set(["bar", "pie", "donut", "bubble", "radial", "area"]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    o.sections = o.sections.map((s: any) => {
      if (CHART_SUBTYPES.has(s.type)) s = { ...s, chartType: s.chartType ?? s.type, type: "chart" };
      const base = {
        ...s,
        heading: typeof s.heading === "string" ? s.heading.replace(/[_\s]+$/, "").trim().slice(0, 80) : s.heading,
        subheading: typeof s.subheading === "string" ? s.subheading.slice(0, 160) : s.subheading,
        insight: typeof s.insight === "string" ? s.insight.slice(0, 400) : s.insight,
        imagePrompt: typeof s.imagePrompt === "string" ? s.imagePrompt.slice(0, 400) : s.imagePrompt,
        unit: typeof s.unit === "string" ? s.unit.slice(0, 20) : s.unit,
      };
      if (s.type === "metric") return { ...base, value: typeof s.value === "string" ? s.value.replace(/[_\s]+$/, "").trim().slice(0, 12) : s.value, unit: typeof s.unit === "string" ? s.unit.replace(/[_\s]+$/, "").trim().slice(0, 20) : s.unit };
      if (s.type === "callout") return { ...base, quote: typeof s.quote === "string" ? s.quote.slice(0, 300) : s.quote, stat: typeof s.stat === "string" ? s.stat.replace(/[_\s]+$/, "").trim().slice(0, 30) : s.stat, attribution: typeof s.attribution === "string" ? s.attribution.slice(0, 120) : s.attribution };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (s.type === "comparison" && Array.isArray(s.items)) return { ...base, items: s.items.map((item: any) => ({ ...item, description: typeof item.description === "string" ? item.description.slice(0, 140) : item.description, valueLabel: typeof item.valueLabel === "string" ? item.valueLabel.slice(0, 20) : item.valueLabel })) };
      if (s.type === "takeaway" && Array.isArray(s.points)) return { ...base, points: s.points.map((p: unknown) => typeof p === "string" ? p.slice(0, 120) : p) };
      if (s.type === "pictograph" && Array.isArray(s.rows)) return { ...base, rows: s.rows.map((r: any) => ({ ...r, label: typeof r.label === "string" ? r.label.slice(0, 40) : r.label, valueLabel: typeof r.valueLabel === "string" ? r.valueLabel.slice(0, 20) : r.valueLabel })), iconLabel: typeof s.iconLabel === "string" ? s.iconLabel.slice(0, 40) : s.iconLabel };
      return base;
    });
  }
  return o;
}

const DEFAULT_STYLE: z.infer<typeof BrandStyleSchema> = {
  primaryColor: "#0f172a",
  secondaryColor: "#3b82f6",
  accentColor: "#f59e0b",
  fontMood: "modern-sans",
  borderRadius: "0.5rem",
  layoutDensity: "airy",
};

// Extract the Content

export const extractContentStep = createStep({
  id: "extract-content",
  inputSchema: InfographicInputSchema,
  outputSchema: InfographicContentSchema,

  execute: async ({ inputData }) => {
    // Topic mode: bypass scraping; generate sections directly from the topic.
    if (inputData.mode === "topic") {
      const langDirective = getLanguageDirective(inputData.locale ?? "en");
      const topicPrompt = `
Create a rich, data-dense infographic about: "${inputData.rawText}"

Density: ${inputData.density}
Focus: ${inputData.narrativeFocus}
${langDirective}

CRITICAL: Generate 5-7 sections. More sections = richer infographic. Aim for variety: mix metrics, comparisons, charts, and takeaways. Every section must add unique, non-redundant information.

Section rules (must match schema exactly):
- type "metric": heading, value (string, MAX 8 chars — e.g. "40", "3-6%", "$1B", "1.2M"). Put units like "%", "USD", "gallons" in the separate \`unit\` field, NEVER in value. insight is the explanation sentence. Optional: trend, subheading.
- type "comparison": heading, scaleDescription (REQUIRED — short caption explaining what the bar means, e.g. "Market share %", "Score out of 100", "Relative speed, higher = faster"), items (3-6 objects with label, value number 0-100 for bar width, valueLabel string showing the real human-readable figure like "60%" or "2.3M users" or "4.5x faster", isHighlight boolean, and a short description string explaining the data point). Include an "insight" sentence summarising the comparison. NEVER use bare numbers without context — always include scaleDescription and valueLabel.
- type "chart": heading, chartType ("pie" | "donut" | "bar"), data (3-7 items: label, value number, optional valueLabel like "42%"), optional unit, optional insight sentence. Use chart when showing categorical breakdown of a whole (pie/donut) or ranked discrete values (bar). Prefer chart over comparison when there are 3+ proportional categories.
- type "takeaway": heading, points (3-5 short strings, each under 120 chars). Include an "insight" sentence summarising why these takeaways matter.
- type "callout": heading, quote (complete sentence — the striking fact), stat (key figure e.g. "$33.7B" or "260M+"), attribution (source context e.g. "Q4 2023 earnings"). Use for the single most stunning milestone.

For every section, include an imagePrompt (1 sentence, concrete visual, no text).
Include a heroImagePrompt for the top of the infographic.
Include metadata.confidenceScore (0-1) and metadata.reasoning.
`.trim();

      const topicRes = await withFallback(
        topicContentAgent,
        topicContentAgentFallback,
        topicPrompt,
        {
          structuredOutput: {
            schema: InfographicContentSchema,
            jsonPromptInjection: true,
          },
        },
      ) as { object?: z.infer<typeof InfographicContentSchema> | null; text?: string };

      let topicObject = topicRes.object;
      if (!topicObject && topicRes.text) {
        try {
          const cleaned = topicRes.text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
          topicObject = JSON.parse(cleaned) as typeof topicObject;
        } catch {
          /* fall through */
        }
      }
      if (!topicObject) {
        console.error("Topic agent structured output missing:", topicRes.text);
        throw new Error("Topic content agent returned no structured content.");
      }
      return InfographicContentSchema.parse(sanitizeContent(topicObject));
    }

    // URL mode: scrape, summarise, format.
    let researchedText: string;
    if (inputData.rawText.startsWith("http")) {
      const JINA_PREFIX = "https://r.jina.ai/";
      const targetUrl = inputData.rawText.startsWith(JINA_PREFIX)
        ? inputData.rawText.slice(JINA_PREFIX.length)
        : inputData.rawText;
      const jinaUrl = `${JINA_PREFIX}${targetUrl}`;

      const BROWSER_UA =
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

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

    const imageGuidance = inputData.generateImages
      ? `\nFor every section, include an imagePrompt (1 sentence, concrete visual, no text).\nInclude a heroImagePrompt for the top of the infographic.`
      : "";

    const formatPrompt = `
Format this researched data into the final infographic schema.
Density: ${inputData.density}
Focus: ${inputData.narrativeFocus}
${getLanguageDirective(inputData.locale ?? "en")}

Section rules (must match schema exactly):
- type "metric": heading, value (string, MAX 8 chars — e.g. "40", "3-6%", "$1B"). Put units like "%", "USD", "ms" in the separate \`unit\` field, NEVER in value. insight is the explanation sentence. Optional: trend, subheading.
- type "comparison": heading, scaleDescription (REQUIRED — short caption explaining what the bar means, e.g. "Market share %", "Score out of 100", "Relative speed, higher = faster"), items (2-6 objects with label, value number 0-100 for bar width, valueLabel string showing the real human-readable figure like "60%" or "2.3M users" or "4.5x faster", isHighlight boolean, and a short description string explaining the data point). Include an "insight" sentence summarising the comparison. NEVER use bare numbers without context — always include scaleDescription and valueLabel.
- type "chart": heading, chartType ("pie" | "donut" | "bar"), data (2-8 items: label, value number, optional valueLabel like "42%"), optional unit, optional insight sentence. Use chart when showing categorical breakdown of a whole (pie/donut) or ranked discrete values (bar). Prefer chart over comparison when there are 3+ proportional categories.
- type "takeaway": heading, points (2-6 short strings, each under 100 chars). Include an "insight" sentence summarising why these takeaways matter.
- type "callout": heading, quote (complete sentence — the striking fact), stat (key figure e.g. "$33.7B" or "260M+"), attribution (source context). Use for the single most stunning fact.
${imageGuidance}
Include metadata.confidenceScore (0-1) and metadata.reasoning.

Raw Research Data: ${summarisedText}
`;

    const formatRes = await formatterAgent.generate(formatPrompt, {
      structuredOutput: {
        schema: InfographicContentSchema,
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

    return InfographicContentSchema.parse(sanitizeContent(object));
  },
});

// Extract the Style

export const extractStyleStep = createStep({
  id: "extract-style",
  inputSchema: z.any(),
  outputSchema: BrandStyleSchema,
  execute: async ({ getInitData }) => {
    const inputData = getInitData() as z.infer<typeof InfographicInputSchema>;
    const extData = inputData as Record<string, unknown>;

    // 0. Color scheme preset — skip AI entirely (studio path)
    const scheme = extData.colorScheme as string | undefined;
    if (scheme && scheme !== "custom" && scheme in COLOR_SCHEME_PRESETS) {
      const p = COLOR_SCHEME_PRESETS[scheme as keyof typeof COLOR_SCHEME_PRESETS];
      return BrandStyleSchema.parse({
        primaryColor: p.primary,
        secondaryColor: p.secondary,
        accentColor: p.accent,
        fontMood: p.fontMood,
        borderRadius: "0.5rem",
        layoutDensity: "airy",
      });
    }
    if (scheme === "custom") {
      const uPrimary    = extData.userPrimary    as string | undefined;
      const uAccent     = extData.userAccent     as string | undefined;
      const uBackground = extData.userBackground as string | undefined;
      if (uPrimary && uAccent) {
        return BrandStyleSchema.parse({
          primaryColor:   uPrimary,
          secondaryColor: uBackground ?? "#f5f5f5",
          accentColor:    uAccent,
          fontMood:       "modern-sans",
          borderRadius:   "0.5rem",
          layoutDensity:  "airy",
        });
      }
    }

    // 1. Image-based style (existing behavior)
    if (inputData.referenceImageBase64) {
      const res = await withFallback(
        styleAgent,
        styleAgentFallback,
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
      ) as { object?: z.infer<typeof BrandStyleSchema> | null };
      return res.object ?? DEFAULT_STYLE;
    }

    // 2. Text-prompt-based style
    if (inputData.stylePrompt && inputData.stylePrompt.trim().length > 0) {
      const prompt = `
The user described the infographic style they want as:
"${inputData.stylePrompt}"

Produce a BrandStyleSchema JSON object that matches this description.
Return ONLY valid JSON, no markdown, no commentary.
`.trim();

      const res = await styleFromTextAgent.generate(prompt, {
        structuredOutput: {
          schema: BrandStyleSchema,
          jsonPromptInjection: true,
        },
      });

      let object = res.object;
      if (!object && res.text) {
        try {
          const cleaned = res.text
            .replace(/```json/gi, "")
            .replace(/```/g, "")
            .trim();
          object = JSON.parse(cleaned) as typeof object;
        } catch {
          /* fall through */
        }
      }
      if (object) {
        try {
          return BrandStyleSchema.parse(object);
        } catch (err) {
          console.warn("[extract-style] text-style parse failed, using default", err);
        }
      }
    }

    return DEFAULT_STYLE;
  },
});

// QA Review

export const reviewDraftStep = createStep({
  id: "review-draft",

  inputSchema: z.any(),

  outputSchema: ReviewOutputSchema,

  execute: async ({ getInitData, getStepResult }) => {
    const inputData = getInitData() as z.infer<typeof InfographicInputSchema>;
    const rawData = inputData.rawText ?? "";

    // Skip critic on topic mode (no source to compare against)
    if (inputData.mode === "topic") {
      return {
        isAccurate: true,
        feedback: "Topic-generated content; no source document to verify against.",
      };
    }

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

// Image generation (optional, parallel)

export const generateImagesStep = createStep({
  id: "generate-images",
  inputSchema: z.any(),
  outputSchema: InfographicContentSchema,
  execute: async ({ getInitData, getStepResult }) => {
    const inputData = getInitData() as z.infer<typeof InfographicInputSchema>;
    const content = getStepResult("extract-content") as z.infer<
      typeof InfographicContentSchema
    >;

    // Topic mode always generates images; URL mode only if user opted in.
    const shouldGenerate =
      inputData.mode === "topic" || inputData.generateImages;
    if (!shouldGenerate) return content;

    const stylePrompt = inputData.stylePrompt
      ? ` Visual style: ${inputData.stylePrompt}.`
      : "";
    const SHARED_SUFFIX =
      " Editorial infographic illustration, clean composition, no text or letters in image.";

    const heroPrompt = content.heroImagePrompt ?? content.title;

    const tasks: Array<Promise<{ key: string; url: string | null }>> = [];
    tasks.push(
      generateImage({
        prompt: `${heroPrompt}.${stylePrompt}${SHARED_SUFFIX}`,
        size: "1792x1024",
      }).then((url) => ({ key: "hero", url })),
    );

    content.sections.forEach((section, idx) => {
      const prompt = section.imagePrompt ?? section.heading;
      tasks.push(
        generateImage({
          prompt: `${prompt}.${stylePrompt}${SHARED_SUFFIX}`,
          size: "1024x1024",
        }).then((url) => ({ key: `section-${idx}`, url })),
      );
    });

    const results = await Promise.all(tasks);
    const map = new Map(results.map((r) => [r.key, r.url]));

    const enriched: z.infer<typeof InfographicContentSchema> = {
      ...content,
      heroImageUrl: map.get("hero") ?? content.heroImageUrl,
      sections: content.sections.map((section, idx) => ({
        ...section,
        imageUrl: map.get(`section-${idx}`) ?? section.imageUrl,
      })) as z.infer<typeof InfographicContentSchema>["sections"],
    };

    return enriched;
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
    const imagesData = getStepResult("generate-images") as z.infer<
      typeof InfographicContentSchema
    > | null;
    const contentData =
      imagesData ??
      (getStepResult("extract-content") as z.infer<typeof InfographicContentSchema>);
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
  .then(generateImagesStep)
  .then(assembleFinalPayloadStep)
  .commit();
