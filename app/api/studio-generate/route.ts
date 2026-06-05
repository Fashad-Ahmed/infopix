/* eslint-disable @typescript-eslint/no-explicit-any */
import "../../../src/mastra/env";
import { NextResponse } from "next/server";
import { studioWorkflow } from "../../../src/mastra/workflows/studio-workflow";
import { StudioInputSchema } from "../../../src/mastra/schemas/schema";
import { parseLocaleCookie } from "../../../src/lib/locale-prompt";
import { classifyError } from "../../../src/lib/api-error";

export const maxDuration = 300;
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Expected a JSON body" }, { status: 400 });
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json({ error: "Expected JSON object body" }, { status: 400 });
    }

    const record = { ...(body as Record<string, unknown>) };

    // Inject locale from cookie so the workflow generates content in the user's language
    if (record.locale === undefined) {
      record.locale = parseLocaleCookie(req.headers.get("cookie"));
    }

    // Proxy plain URLs through Jina AI reader (same as /api/generate)
    if (
      record.mode !== "topic" &&
      typeof record.rawText === "string" &&
      record.rawText.startsWith("http") &&
      !record.rawText.startsWith("https://r.jina.ai/")
    ) {
      record.rawText = `https://r.jina.ai/${record.rawText}`;
    }

    const parsed = StudioInputSchema.safeParse(record);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // Studio always generates images (unless illustrationStyle is "none")
    const inputData = {
      ...parsed.data,
      generateImages: parsed.data.illustrationStyle !== "none",
    };

    const run = await studioWorkflow.createRun();
    console.log(`[studio-generate] Starting workflow run ${run.runId}`);

    const runResult = await run.start({ inputData });

    let finalData = null;
    if (runResult.status === "success" && (runResult as any).result != null) {
      finalData = (runResult as any).result;
    }
    const assembleStep = runResult.steps?.["assemble-studio-payload"];
    if (!finalData && assembleStep?.status === "success") {
      finalData = assembleStep.output;
    }

    if (!finalData) {
      const failedStep = Object.values(runResult.steps ?? {}).find(
        (s: any) => s.status === "failed",
      );
      const stepError = failedStep ? (failedStep as any).error : undefined;
      console.error("[studio-generate] Workflow failed:", JSON.stringify(runResult, null, 2));
      if (stepError) {
        const classified = classifyError(stepError);
        return NextResponse.json(
          { error: classified.message, code: classified.code },
          { status: classified.status },
        );
      }
      return NextResponse.json(
        { error: "Workflow failed to produce output. Please try again.", code: "GENERATION_FAILED" },
        { status: 500 },
      );
    }

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("[studio-generate] Error:", error);
    const classified = classifyError(error);
    return NextResponse.json(
      { error: classified.message, code: classified.code },
      { status: classified.status },
    );
  }
}
