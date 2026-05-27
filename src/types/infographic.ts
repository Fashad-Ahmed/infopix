import type { z } from "zod";
import type {
  BrandStyleSchema,
  InfographicContentSchema,
  InfographicInputSchema,
  ReviewOutputSchema,
  FinalPayloadSchema,
  StudioInputSchema,
  StudioFinalPayloadSchema,
  SlotAssignmentSchema,
  LayoutSpecSchema,
  RegionSchema,
  CalloutSection as CalloutSectionSchema,
  PictographSection as PictographSectionSchema,
} from "../mastra/schemas/schema";

export type InfographicInput = z.infer<typeof InfographicInputSchema>;
export type InfographicContent = z.infer<typeof InfographicContentSchema>;
export type BrandStyle = z.infer<typeof BrandStyleSchema>;
export type ReviewOutput = z.infer<typeof ReviewOutputSchema>;
export type FinalPayload = z.infer<typeof FinalPayloadSchema>;
export type StudioInput = z.infer<typeof StudioInputSchema>;
export type StudioFinalPayload = z.infer<typeof StudioFinalPayloadSchema>;
export type SlotAssignment = z.infer<typeof SlotAssignmentSchema>;
/** @deprecated Use SlotAssignment — kept for backward compat with tests */
export type LayoutSpec = z.infer<typeof LayoutSpecSchema>;
/** @deprecated Use SlotAssignment — kept for backward compat with tests */
export type RegionSpec = z.infer<typeof RegionSchema>;

export type InfographicSection = InfographicContent["sections"][number];

export type MetricSection = Extract<InfographicSection, { type: "metric" }>;
export type ComparisonSection = Extract<InfographicSection, { type: "comparison" }>;
export type ChartSection = Extract<InfographicSection, { type: "chart" }>;
export type TakeawaySection = Extract<InfographicSection, { type: "takeaway" }>;
export type CalloutSection = z.infer<typeof CalloutSectionSchema>;
export type PictographSection = z.infer<typeof PictographSectionSchema>;

export type GenerationMode = "url" | "topic";

export type Density = InfographicInput["density"];
export type NarrativeFocus = InfographicInput["narrativeFocus"];

/** Shape consumed by the <Infographic /> component (style is optional, denormalized). */
export type InfographicViewModel = {
  title: string;
  summary: string;
  sections: InfographicSection[];
  heroImageUrl?: string;
  style?: BrandStyle;
};

export type ToastType = "success" | "error" | "info";

export type Toast = {
  id: string;
  message: string;
  type: ToastType;
};
