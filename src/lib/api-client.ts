import type {
  Density,
  GenerationMode,
  NarrativeFocus,
} from "../types/infographic";

export type GenerateRequest = {
  rawText: string;
  mode: GenerationMode;
  stylePrompt?: string;
  generateImages: boolean;
  density?: Density;
  narrativeFocus?: NarrativeFocus;
};

export class GenerateError extends Error {
  status: number;
  details: string;
  constructor(status: number, details: string) {
    super(`API Error ${status}: ${details}`);
    this.status = status;
    this.details = details;
  }
}

export async function postGenerate(
  body: GenerateRequest,
): Promise<unknown> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      density: "standard",
      narrativeFocus: "data-heavy",
      ...body,
    }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GenerateError(response.status, text);
  }

  return response.json();
}
