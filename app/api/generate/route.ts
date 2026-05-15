/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { infographicWorkflow } from "../../../src/mastra/workflows/infographic-workflow";
import { InfographicInputSchema } from "../../../src/mastra/schemas/schema";
import {
  buildCacheKey,
  getCachedInfographic,
  setCachedInfographic,
} from "../../../src/lib/infographic-cache";
import {
  INSUFFICIENT_DATA_MESSAGE,
  isInsufficientData,
} from "../../../src/lib/generation-errors";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Expected a JSON body" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "INVALID_REQUEST", message: "Expected JSON object body" },
        { status: 400 },
      );
    }

    const record = { ...(body as Record<string, unknown>) };
    const userRawText =
      typeof record.rawText === "string" ? record.rawText : "";

    if (userRawText.startsWith("http")) {
      record.rawText = `https://r.jina.ai/${userRawText}`;
      console.log(`🔗 Proxying through Jina AI: ${record.rawText}`);
    }

    const parsed = InfographicInputSchema.safeParse(record);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "INVALID_REQUEST",
          message: "Invalid request",
          details: parsed.error.flatten(),
        },
        { status: 400 },
      );
    }

    const narrativeFocus = parsed.data.narrativeFocus ?? "data-heavy";
    const cacheKey = buildCacheKey(
      userRawText || parsed.data.rawText,
      parsed.data.density,
      narrativeFocus,
    );

    const cached = await getCachedInfographic(cacheKey);
    if (cached) {
      console.log(`⚡ Cache hit: ${cacheKey}`);
      return NextResponse.json({ ...cached, cached: true });
    }

    const run = await infographicWorkflow.createRun();
    console.log(`🚀 Starting Workflow Run ID: ${run.runId}`);

    const runResult = await run.start({ inputData: parsed.data });

    let finalData = null;
    if (runResult.status === "success" && (runResult as any).result != null) {
      finalData = (runResult as any).result;
    }
    const assembleStep = runResult.steps?.["assemble-payload"];
    if (!finalData && assembleStep?.status === "success") {
      finalData = assembleStep.output;
    }

    if (!finalData) {
      const stepError =
        assembleStep?.status === "failed"
          ? (assembleStep as { error?: { message?: string } }).error
          : (runResult as { error?: { message?: string } }).error;
      const message =
        stepError?.message ??
        "Workflow failed to produce output. The source may be too large or unstructured.";

      console.error(
        "Workflow failed. Run Result:",
        JSON.stringify(runResult, null, 2),
      );

      return NextResponse.json(
        { error: "WORKFLOW_FAILED", message },
        { status: 500 },
      );
    }

    if (
      isInsufficientData(finalData.content, narrativeFocus)
    ) {
      return NextResponse.json(
        {
          error: "INSUFFICIENT_DATA",
          message: INSUFFICIENT_DATA_MESSAGE,
        },
        { status: 422 },
      );
    }

    await setCachedInfographic(cacheKey, finalData);

    return NextResponse.json({ ...finalData, cached: false });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      {
        error: "WORKFLOW_FAILED",
        message:
          error instanceof Error
            ? error.message
            : "Internal server error",
      },
      { status: 500 },
    );
  }
}
