import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
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
    const contentPrompt = `
    You are an expert data extractor. The user will provide a URL or text.
    If it is a URL, use your scrape-website tool to read it.
    
    CRITICAL INSTRUCTIONS:
    1. Do NOT output raw HTML, CSS, script tags, or long code blocks.
    2. Extract ONLY the core narrative, key features, statistical metrics, and architectural takeaways.
    3. Compress and summarize this extracted data into a clean, readable text format of UNDER 1000 words.
    4. Ensure no critical numbers or brand facts are lost in the compression.
    
    Input: ${inputData.rawText}
  `;

    const researchRes = await contentAgent.generate(contentPrompt);

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

Raw Research Data: ${researchRes.text}
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
    } catch (error) {
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
