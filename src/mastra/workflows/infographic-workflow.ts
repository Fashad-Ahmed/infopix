import { createWorkflow, createStep } from "@mastra/core/workflows";
import { z } from "zod";
import {
  contentAgent,
  styleAgent,
  criticAgent,
} from "../agents/infographic-agent";
import {
  InfographicInputSchema,
  InfographicContentSchema,
  BrandStyleSchema,
} from "../schemas/schema";

// Extract the Content

const extractContentStep = createStep({
  id: "extract-content",
  inputSchema: InfographicInputSchema, // Takes initial workflow input
  outputSchema: InfographicContentSchema,
  execute: async ({ inputData }) => {
    const prompt = `
      Raw Text: ${inputData.rawText}
      Density: ${inputData.density}
      Focus: ${inputData.narrativeFocus}
    `;

    const res = await contentAgent.generate(prompt, {
      structuredOutput: { schema: InfographicContentSchema },
    });

    return res.object;
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

    return res.object;
  },
});

// QA Review

const reviewDraftStep = createStep({
  id: "review-draft",
  inputSchema: z.any(),
  outputSchema: z.object({
    finalContent: InfographicContentSchema,
    qaApproved: z.boolean(),
    qaFeedback: z.string().optional(),
  }),
  execute: async ({ getInitData, getStepResult }) => {
    // Fetch results from specific previous steps
    const draft = getStepResult("extract-content") as z.infer<
      typeof InfographicContentSchema
    >;
    const originalText =
      (getInitData() as z.infer<typeof InfographicInputSchema>)?.rawText ||
      "No context provided";

    const qaPrompt = `
      Original Text: ${originalText}
      Drafted JSON: ${JSON.stringify(draft)}
      
      Verify that no metrics were hallucinated and the narrative is accurate.
    `;

    const res = await criticAgent.generate(qaPrompt, {
      structuredOutput: {
        schema: z.object({
          isAccurate: z.boolean(),
          feedback: z
            .string()
            .describe(
              "Leave empty if accurate, otherwise explain what is wrong.",
            ),
        }),
      },
    });

    return {
      finalContent: draft,
      qaApproved: res.object.isAccurate,
      qaFeedback: res.object.feedback,
    };
  },
});

// Assemble Payload

const FinalPayloadSchema = z.object({
  content: InfographicContentSchema,
  style: BrandStyleSchema,
  qaReport: z.any(),
});

const assembleFinalPayloadStep = createStep({
  id: "assemble-payload",
  inputSchema: z.any(),
  outputSchema: FinalPayloadSchema,
  execute: async ({ getStepResult }) => {
    // Pull the final data from the previous steps to assemble the ultimate payload
    const styleData = getStepResult("extract-style") as z.infer<
      typeof BrandStyleSchema
    >;
    const reviewData = getStepResult("review-draft") as {
      finalContent: z.infer<typeof InfographicContentSchema>,
      qaApproved: boolean,
      qaFeedback?: string,
    };

    return {
      content: reviewData.finalContent,
      style: styleData,
      qaReport: {
        approved: reviewData.qaApproved,
        feedback: reviewData.qaFeedback,
      },
    };
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
