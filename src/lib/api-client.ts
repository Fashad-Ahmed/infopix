import type {
  Density,
  GenerationMode,
  NarrativeFocus,
  StudioInput,
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
  code: string;
  details: string;
  constructor(status: number, rawText: string) {
    let message = rawText;
    let code = "INTERNAL";
    try {
      const parsed = JSON.parse(rawText) as { error?: string; code?: string };
      if (parsed.error) message = parsed.error;
      if (parsed.code) code = parsed.code;
    } catch {
      // rawText isn't JSON, use as-is
    }
    super(message);
    this.status = status;
    this.code = code;
    this.details = rawText;
  }
}

export async function postGenerate(
  body: GenerateRequest,
): Promise<unknown> {
  const response = await fetch("/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ density: "standard", narrativeFocus: "data-heavy", ...body }),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GenerateError(response.status, text);
  }

  return response.json();
}

export type StudioGenerateRequest = Omit<StudioInput, "generateImages" | "locale">;

export async function postStudioGenerate(body: StudioGenerateRequest): Promise<unknown> {
  const response = await fetch("/api/studio-generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new GenerateError(response.status, text);
  }

  return response.json();
}
