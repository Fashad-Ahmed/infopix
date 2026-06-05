export type ApiErrorCode =
  | "QUOTA_EXCEEDED"
  | "URL_INACCESSIBLE"
  | "VALIDATION_FAILED"
  | "GENERATION_FAILED"
  | "INTERNAL";

export function classifyError(err: unknown): {
  message: string;
  code: ApiErrorCode;
  status: number;
} {
  let str = "";
  try { str = JSON.stringify(err).toLowerCase(); } catch { str = String(err).toLowerCase(); }

  const errMsg = err instanceof Error ? err.message.toLowerCase() : str;

  if (
    str.includes("429") ||
    str.includes("resource_exhausted") ||
    str.includes("prepayment credits") ||
    str.includes("too many requests") ||
    str.includes("overloaded") ||
    errMsg.includes("quota")
  ) {
    return {
      message: "AI quota exceeded. The backup model should activate automatically — please try again.",
      code: "QUOTA_EXCEEDED",
      status: 503,
    };
  }

  if (
    errMsg.includes("url is not accessible") ||
    errMsg.includes("unable to fetch content") ||
    errMsg.includes("check the url")
  ) {
    return {
      message: "Could not access that URL. Make sure it is publicly accessible and not behind a login.",
      code: "URL_INACCESSIBLE",
      status: 422,
    };
  }

  if (
    str.includes("structured output validation failed") ||
    str.includes("invalid discriminator") ||
    errMsg.includes("schema validation") ||
    errMsg.includes("zodparser")
  ) {
    return {
      message: "The AI returned an unexpected content format. Try a different topic or simplify your input.",
      code: "VALIDATION_FAILED",
      status: 422,
    };
  }

  const message = err instanceof Error ? err.message : "Generation failed. Please try again.";
  return { message, code: "INTERNAL", status: 500 };
}
