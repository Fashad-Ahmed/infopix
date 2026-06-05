type AgentLike = { generate: (...args: unknown[]) => Promise<unknown> };

function isQuotaError(err: unknown): boolean {
  if (err == null) return false;

  // Check object properties (Mastra SDK wraps errors as structured objects)
  if (typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (e["statusCode"] === 429 || e["status"] === 429) return true;
    if (typeof e["status"] === "string" && e["status"].toLowerCase().includes("resource_exhausted")) return true;
    if (e["isRetryable"] === true && (e["statusCode"] === 429 || e["status"] === 429)) return true;
    // Nested: e.data.error.code
    const data = e["data"] as Record<string, unknown> | undefined;
    const inner = data?.["error"] as Record<string, unknown> | undefined;
    if (inner?.["code"] === 429) return true;
    if (typeof inner?.["status"] === "string" && inner["status"].toLowerCase().includes("resource_exhausted")) return true;
  }

  // Fallback: stringify and scan (catches Error messages, plain strings)
  const msg = JSON.stringify(err).toLowerCase();
  return (
    msg.includes("429") ||
    msg.includes("resource_exhausted") ||
    msg.includes("quota") ||
    msg.includes("rate limit") ||
    msg.includes("too many requests") ||
    msg.includes("prepayment credits are depleted") ||
    msg.includes("overloaded")
  );
}

/**
 * Calls primary agent; on quota/rate-limit error silently retries with fallback.
 * All other errors propagate normally.
 */
export async function withFallback(
  primary: AgentLike,
  fallback: AgentLike,
  ...args: unknown[]
): Promise<unknown> {
  try {
    return await primary.generate(...args);
  } catch (err) {
    if (!isQuotaError(err)) throw err;
    console.warn("[model-fallback] primary quota exceeded, retrying with fallback model");
    return fallback.generate(...args);
  }
}
