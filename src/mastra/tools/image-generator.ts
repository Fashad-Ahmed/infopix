import { createTool } from "@mastra/core/tools";
import { z } from "zod";

const OPENAI_IMAGE_URL = "https://api.openai.com/v1/images/generations";

export type ImageSize =
  | "1024x1024"
  | "1536x1024"
  | "1024x1536"
  | "1792x1024"
  | "1024x1792"
  | "auto";

export type GenerateImageOptions = {
  prompt: string;
  size?: ImageSize;
  style?: "vivid" | "natural";
  model?: "dall-e-3" | "gpt-image-1";
};

const DALLE3_SIZES = new Set(["1024x1024", "1792x1024", "1024x1792"]);
const GPT_IMAGE_SIZES = new Set([
  "1024x1024",
  "1536x1024",
  "1024x1536",
  "auto",
]);

function normalizeSize(model: string, size: ImageSize): string {
  if (model === "dall-e-3") {
    if (DALLE3_SIZES.has(size)) return size;
    if (size === "1536x1024") return "1792x1024";
    if (size === "1024x1536") return "1024x1792";
    return "1024x1024";
  }
  // gpt-image-1
  if (GPT_IMAGE_SIZES.has(size)) return size;
  if (size === "1792x1024") return "1536x1024";
  if (size === "1024x1792") return "1024x1536";
  return "1024x1024";
}

/**
 * Generate one image via OpenAI. Returns a data URL (base64) so it embeds
 * directly in downloads without a cross-origin fetch.
 */
export async function generateImage({
  prompt,
  size = "1024x1024",
  style = "vivid",
  model = (process.env.OPENAI_IMAGE_MODEL as "dall-e-3" | "gpt-image-1") ??
    "gpt-image-1",
}: GenerateImageOptions): Promise<string | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.warn("[image-generator] OPENAI_API_KEY not set; skipping image generation");
    return null;
  }

  const finalSize = normalizeSize(model, size);
  const body: Record<string, unknown> = {
    model,
    prompt,
    size: finalSize,
    n: 1,
  };
  if (model === "dall-e-3") {
    body.style = style;
    body.response_format = "b64_json";
  }
  // gpt-image-1: no `style`, no `response_format` — always returns b64_json.

  try {
    const res = await fetch(OPENAI_IMAGE_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const text = await res.text();
      console.error(`[image-generator] ${res.status}: ${text.slice(0, 300)}`);
      return null;
    }
    const json = (await res.json()) as {
      data?: Array<{ b64_json?: string; url?: string }>;
    };
    const item = json.data?.[0];
    if (item?.b64_json) return `data:image/png;base64,${item.b64_json}`;
    if (item?.url) return item.url;
    return null;
  } catch (err) {
    console.error("[image-generator] request failed", err);
    return null;
  }
}

export const imageGeneratorTool = createTool({
  id: "image-generator",
  description:
    "Generate a single illustrative image from a short prompt via OpenAI image API. Returns a data URL or null on failure.",
  inputSchema: z.object({
    prompt: z.string().min(3).max(400),
    size: z
      .enum([
        "1024x1024",
        "1536x1024",
        "1024x1536",
        "1792x1024",
        "1024x1792",
        "auto",
      ])
      .default("1024x1024"),
    style: z.enum(["vivid", "natural"]).default("vivid"),
  }),
  outputSchema: z.object({
    imageUrl: z.string().nullable(),
  }),
  execute: async ({ prompt, size, style }) => {
    const url = await generateImage({ prompt, size, style });
    return { imageUrl: url };
  },
});
