/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";
import { infographicWorkflow } from "../../../src/mastra/workflows/infographic-workflow";
import { buildWhatsAppMessage } from "../spoki-webhook/route";
import type { z } from "zod";
import type { FinalPayloadSchema } from "../../../src/mastra/schemas/schema";

type FinalPayload = z.infer<typeof FinalPayloadSchema>;

/**
 * Preview endpoint: runs the Mastra workflow synchronously and returns
 * the formatted WhatsApp message without sending it to Spoki.
 * Used by the /whatsapp admin page test panel.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: { rawText?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const rawText = body.rawText?.trim();
  if (!rawText || rawText.length < 10) {
    return NextResponse.json(
      { error: "rawText must be at least 10 characters" },
      { status: 400 },
    );
  }

  const proxied = rawText.startsWith("http")
    ? `https://r.jina.ai/${rawText}`
    : rawText;

  try {
    const run = await infographicWorkflow.createRun();
    const runResult = await run.start({
      inputData: {
        rawText: proxied,
        density: "standard",
        narrativeFocus: "data-heavy",
      },
    });

    let finalData: FinalPayload | null = (runResult as any).result ?? null;
    if (!finalData) {
      const assembleStep = (runResult as any).steps?.["assemble-payload"];
      if (assembleStep?.status === "success") {
        finalData = assembleStep.output as FinalPayload;
      }
    }

    if (!finalData) {
      return NextResponse.json(
        { error: "Workflow produced no output" },
        { status: 500 },
      );
    }

    const whatsappMessage = buildWhatsAppMessage(finalData);

    return NextResponse.json({
      whatsappMessage,
      content: finalData.content,
      style: finalData.style,
    });
  } catch (err) {
    console.error("[spoki-test] Workflow error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Workflow failed" },
      { status: 500 },
    );
  }
}
