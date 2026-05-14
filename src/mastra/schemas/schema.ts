import { z } from "zod";

export const InfographicInputSchema = z.object({
  rawText: z.string().min(50, "Provide more context for better extraction"),
  referenceImageBase64: z.string().optional(),
  density: z.enum(["executive-summary", "standard", "deep-dive"]),
  narrativeFocus: z
    .enum(["data-heavy", "narrative-driven", "action-oriented"])
    .default("data-heavy"),
});

export const BrandStyleSchema = z.object({
  primaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid Hex"),
  secondaryColor: z
    .string()
    .regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, "Invalid Hex"),
  accentColor: z
    .string()
    .describe("A contrasting color for highlighting critical insights"),
  fontMood: z.enum(["corporate", "modern-sans", "playful", "monospaced"]),
  borderRadius: z
    .string()
    .describe("Tailwind-style or CSS value (e.g., '0.5rem')"),
  layoutDensity: z
    .enum(["compact", "airy", "spacious"])
    .describe("Controls whitespace and padding"),
});

const BaseSection = z.object({
  heading: z.string().max(40),
  subheading: z.string().max(80).optional(),
});

const MetricSection = BaseSection.extend({
  type: z.literal("metric"),
  value: z.string().describe("The primary number or stat"),
  unit: z.string().optional(),
  trend: z.enum(["up", "down", "neutral"]).optional(),
  insight: z.string().describe("Briefly explain why this number matters"),
});

const ComparisonSection = BaseSection.extend({
  type: z.literal("comparison"),
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z.number(),
        isHighlight: z.boolean(),
      }),
    )
    .min(2)
    .max(4),
});

const KeyTakeawaySection = BaseSection.extend({
  type: z.literal("takeaway"),
  points: z.array(z.string()).min(2).max(3),
});

export const InfographicContentSchema = z.object({
  title: z.string().min(1).max(60),
  summary: z
    .string()
    .describe("The 'Too Long; Didn't Read' summary for the header"),

  sections: z
    .array(
      z.discriminatedUnion("type", [
        MetricSection,
        ComparisonSection,
        KeyTakeawaySection,
      ]),
    )
    .min(2)
    .max(5),

  metadata: z.object({
    confidenceScore: z.number().min(0).max(1),
    reasoning: z
      .string()
      .describe("Briefly explain why these sections were chosen for this data"),
  }),
});

export const ReviewOutputSchema = z.object({
  isAccurate: z.boolean(),
  feedback: z.string(),
});

export const FinalPayloadSchema = z.object({
  content: InfographicContentSchema,
  style: BrandStyleSchema,
  qaReport: z.any(),
});
