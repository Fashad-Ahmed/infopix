import type { z } from "zod";
import type { InfographicContentSchema } from "../mastra/schemas/schema";

export type ApiErrorCode =
  | "INSUFFICIENT_DATA"
  | "WORKFLOW_FAILED"
  | "INVALID_REQUEST";

export function isInsufficientData(
  content: z.infer<typeof InfographicContentSchema>,
  narrativeFocus: string,
): boolean {
  const score = content.metadata?.confidenceScore ?? 0;
  if (score < 0.35) return true;

  const hasCharts = content.sections.some(
    (s) => s.type === "metric" || s.type === "comparison",
  );

  if (
    narrativeFocus === "data-heavy" &&
    !hasCharts &&
    score < 0.55
  ) {
    return true;
  }

  return false;
}

export const INSUFFICIENT_DATA_MESSAGE =
  "We couldn't extract enough hard data from that link. Try a document with more metrics, benchmarks, or comparisons.";
