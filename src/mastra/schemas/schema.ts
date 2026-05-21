import { z } from "zod";

export const InfographicInputSchema = z.object({
  rawText: z.string().min(3, "Provide a topic, URL, or content"),
  mode: z.enum(["url", "topic"]).default("url"),
  referenceImageBase64: z.string().optional(),
  stylePrompt: z
    .string()
    .max(400)
    .optional()
    .describe("Natural language description of desired infographic style"),
  generateImages: z
    .boolean()
    .default(false)
    .describe("Generate AI imagery for sections via OpenAI"),
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
  imagePrompt: z
    .string()
    .max(200)
    .optional()
    .describe("Short visual prompt for AI image generation"),
  imageUrl: z.string().optional(),
});

const MetricSection = BaseSection.extend({
  type: z.literal("metric"),
  value: z
    .string()
    .describe(
      "The primary number or stat (e.g. '40', '3-6%', '$1.2B'). Keep under ~12 chars; units go in `unit` field.",
    ),
  unit: z.string().optional(),
  trend: z.enum(["up", "down", "neutral"]).optional(),
  insight: z.string().describe("Briefly explain why this number matters"),
});

const ComparisonSection = BaseSection.extend({
  type: z.literal("comparison"),
  scaleDescription: z
    .string()
    .max(120)
    .optional()
    .describe(
      "What the bar represents — e.g. 'Relative speed, higher = faster' or 'Market share %' or 'Score out of 100'",
    ),
  items: z
    .array(
      z.object({
        label: z.string(),
        value: z
          .number()
          .describe(
            "Bar length, 0-100. This is the visual width only — put the real-world figure in valueLabel.",
          ),
        valueLabel: z
          .string()
          .max(20)
          .optional()
          .describe(
            "Human-readable value displayed beside the bar — e.g. '60%', '2.3M users', '4.5x faster', '$1.2B'. Falls back to the numeric value if omitted.",
          ),
        isHighlight: z.boolean(),
        description: z
          .string()
          .max(140)
          .optional()
          .describe("One short clause explaining this data point"),
      }),
    )
    .min(2)
    .max(4),
  insight: z
    .string()
    .max(220)
    .optional()
    .describe("One sentence summarising what this comparison reveals"),
});

const ChartSection = BaseSection.extend({
  type: z.literal("chart"),
  chartType: z
    .enum(["pie", "donut", "bar"])
    .describe(
      "pie/donut for proportional breakdown of a whole; bar for ranked discrete values",
    ),
  data: z
    .array(
      z.object({
        label: z.string().max(40),
        value: z.number().describe("Numeric value"),
        valueLabel: z
          .string()
          .max(20)
          .optional()
          .describe("Human-readable value (e.g. '42%', '$1.2B')"),
      }),
    )
    .min(2)
    .max(6),
  unit: z
    .string()
    .max(20)
    .optional()
    .describe("Unit shown beside numbers in legend/tooltip (e.g. '%', 'M users')"),
  insight: z
    .string()
    .max(220)
    .optional()
    .describe("One sentence summarising what the chart reveals"),
});

const KeyTakeawaySection = BaseSection.extend({
  type: z.literal("takeaway"),
  points: z.array(z.string()).min(2).max(3),
  insight: z
    .string()
    .max(220)
    .optional()
    .describe("One sentence summarising why these takeaways matter"),
});

export const InfographicContentSchema = z.object({
  title: z.string().min(1).max(60),
  summary: z
    .string()
    .describe("The 'Too Long; Didn't Read' summary for the header"),
  heroImagePrompt: z
    .string()
    .max(200)
    .optional()
    .describe("Visual prompt for a hero image at top of infographic"),
  heroImageUrl: z.string().optional(),
  sections: z
    .array(
      z.discriminatedUnion("type", [
        MetricSection,
        ComparisonSection,
        ChartSection,
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
