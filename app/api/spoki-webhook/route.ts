import { after } from "next/server";
import { NextRequest, NextResponse } from "next/server";
import { infographicWorkflow } from "../../../src/mastra/workflows/infographic-workflow";
import type { z } from "zod";
import type { FinalPayloadSchema } from "../../../src/mastra/schemas/schema";

type FinalPayload = z.infer<typeof FinalPayloadSchema>;

/** Spoki v2 inbound payload (nested under `data`) */
type SpokiV2Payload = {
  version?: number;
  event?: string;
  data?: {
    from_phone?: string;
    text?: string;
    type?: string;
    [key: string]: unknown;
  };
  // Legacy flat fields — kept for backward compat / testing
  phone?: string;
  contact_id?: string;
  message?: string;
  text?: string;
  [key: string]: unknown;
};

type SectionAny =
  | { type: "metric"; heading: string; value: string; unit?: string; insight: string }
  | { type: "takeaway"; heading: string; points: string[] }
  | { type: "comparison"; heading: string; items: { label: string; value: number; isHighlight: boolean }[] };

/** Extract phone + message from any Spoki payload variant. */
function extractFields(body: SpokiV2Payload): { phone: string; message: string } | null {
  // Spoki v2 — nested under data
  const phone = body.data?.from_phone ?? body.phone ?? body.contact_id;
  const message = body.data?.text ?? body.message ?? body.text;
  if (phone && message) return { phone, message };
  return null;
}

/**
 * Verify Spoki HMAC-SHA256 signature.
 * Header format: "t=<unix_ts>,v2=<hex_digest>"
 * Signed payload: "<timestamp>.<raw_body>"
 */
async function verifySpokiSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
): Promise<boolean> {
  const tMatch = signatureHeader.match(/t=(\d+)/);
  const v2Match = signatureHeader.match(/v2=([a-f0-9]+)/);
  if (!tMatch || !v2Match) return false;

  const timestamp = tMatch[1];
  const receivedSig = v2Match[1];
  const payload = `${timestamp}.${rawBody}`;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const computedSig = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSig === receivedSig;
}

export function buildWhatsAppMessage(payload: FinalPayload): string {
  const { content } = payload;
  const lines: string[] = [];

  lines.push(`*${content.title}*`);
  lines.push("");
  lines.push(content.summary);

  const first = content.sections[0] as SectionAny | undefined;
  if (first) {
    lines.push("");
    lines.push(`*${first.heading}*`);

    if (first.type === "metric") {
      const val = first.unit ? `${first.value} ${first.unit}` : first.value;
      lines.push(val);
      lines.push(first.insight);
    } else if (first.type === "takeaway") {
      first.points.forEach((p) => lines.push(`• ${p}`));
    } else if (first.type === "comparison") {
      first.items.forEach((item) => lines.push(`• ${item.label}: ${item.value}`));
    }
  }

  return lines.join("\n");
}

export async function sendSpokiMessage(phone: string, body: string): Promise<void> {
  const automationUrl = process.env.SPOKI_AUTOMATION_URL;
  const automationSecret = process.env.SPOKI_AUTOMATION_SECRET;

  if (!automationUrl || !automationSecret) {
    console.error("[spoki-webhook] SPOKI_AUTOMATION_URL or SPOKI_AUTOMATION_SECRET not set");
    return;
  }

  const res = await fetch(automationUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      secret: automationSecret,
      phone,
      custom_fields: { CUSTOM_FIELD_1: body },
    }),
  });

  const detail = await res.text().catch(() => "(unreadable)");
  if (!res.ok) {
    console.error(`[spoki-webhook] Spoki send failed ${res.status}: ${detail}`);
  } else {
    console.log(`[spoki-webhook] Spoki send OK ${res.status}: ${detail}`);
  }
}

const HELP_MESSAGE =
  "👋 *InfoPix Bot*\n\nSend me a URL to generate a WhatsApp-ready infographic summary.\n\nExample:\nhttps://github.com/nestjs/nest";

export async function runAndNotify(phone: string, rawText: string): Promise<void> {
  // Guard: too short to be useful content — send help instead of failing silently
  const isUrl = rawText.startsWith("http");
  if (!isUrl && rawText.length < 50) {
    await sendSpokiMessage(phone, HELP_MESSAGE);
    return;
  }

  try {
    const run = await infographicWorkflow.createRun();
    const runResult = await run.start({
      inputData: {
        rawText,
        density: "standard",
        narrativeFocus: "data-heavy",
      },
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let finalData: FinalPayload | null = (runResult as any).result ?? null;

    if (!finalData) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const assembleStep = (runResult as any).steps?.["assemble-payload"];
      if (assembleStep?.status === "success") {
        finalData = assembleStep.output as FinalPayload;
      }
    }

    if (!finalData) throw new Error("Workflow produced no output");

    const message = buildWhatsAppMessage(finalData);
    await sendSpokiMessage(phone, message);
  } catch (err) {
    console.error("[spoki-webhook] Background job failed:", err);
  }
}

/** GET — Spoki webhook verification challenge */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const { searchParams } = req.nextUrl;
  const token = searchParams.get("hub.verify_token") ?? searchParams.get("token");
  const challenge = searchParams.get("hub.challenge") ?? searchParams.get("challenge");

  const secret = process.env.SPOKI_WEBHOOK_SECRET;
  if (secret && token !== secret) {
    return new NextResponse("Forbidden", { status: 403 });
  }

  if (challenge) return new NextResponse(challenge, { status: 200 });
  return NextResponse.json({ ok: true, service: "infopix-spoki-webhook" });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  const secret = process.env.SPOKI_WEBHOOK_SECRET;

  // Read raw body text first so we can verify signature AND parse JSON
  const rawBody = await req.text();

  if (secret) {
    const sigHeader = req.headers.get("x-spoki-signature") ?? "";
    const valid = sigHeader
      ? await verifySpokiSignature(rawBody, sigHeader, secret)
      : false;
    if (!valid) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  let body: SpokiV2Payload;
  try {
    body = JSON.parse(rawBody) as SpokiV2Payload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const fields = extractFields(body);
  if (!fields) {
    return NextResponse.json(
      { error: "Missing required fields: from_phone/phone and text/message" },
      { status: 400 },
    );
  }

  const { phone, message } = fields;
  const rawText = message.startsWith("http")
    ? `https://r.jina.ai/${message}`
    : message;

  after(runAndNotify(phone, rawText));

  return NextResponse.json({ ok: true });
}
