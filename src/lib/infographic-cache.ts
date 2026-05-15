import { createHash } from "crypto";
import { kv } from "@vercel/kv";
import type { z } from "zod";
import type { FinalPayloadSchema } from "../mastra/schemas/schema";

export type CachedInfographic = z.infer<typeof FinalPayloadSchema>;

const CACHE_TTL_SECONDS = 60 * 60 * 24 * 7; // 7 days

export function isCacheEnabled(): boolean {
  return Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);
}

/** Normalize user URL/text so the same link always hits the same cache key. */
export function normalizeCacheInput(rawText: string): string {
  const trimmed = rawText.trim();
  if (!trimmed.startsWith("http")) return trimmed.toLowerCase();

  try {
    const url = new URL(trimmed);
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    if (url.pathname.endsWith("/")) {
      url.pathname = url.pathname.slice(0, -1) || "/";
    }
    return url.toString();
  } catch {
    return trimmed.toLowerCase();
  }
}

export function buildCacheKey(
  rawText: string,
  density: string,
  narrativeFocus: string,
): string {
  const normalized = normalizeCacheInput(rawText);
  const hash = createHash("sha256")
    .update(`${normalized}|${density}|${narrativeFocus}`)
    .digest("hex")
    .slice(0, 32);
  return `infopix:v1:${hash}`;
}

export async function getCachedInfographic(
  key: string,
): Promise<CachedInfographic | null> {
  if (!isCacheEnabled()) return null;
  try {
    const hit = await kv.get<CachedInfographic>(key);
    return hit ?? null;
  } catch (err) {
    console.warn("KV cache read failed:", err);
    return null;
  }
}

export async function setCachedInfographic(
  key: string,
  payload: CachedInfographic,
): Promise<void> {
  if (!isCacheEnabled()) return;
  try {
    await kv.set(key, payload, { ex: CACHE_TTL_SECONDS });
  } catch (err) {
    console.warn("KV cache write failed:", err);
  }
}
