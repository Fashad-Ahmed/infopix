/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { infographicWorkflow } from "../../../src/mastra/workflows/infographic-workflow";
import { InfographicInputSchema } from "../../../src/mastra/schemas/schema";

export async function POST(req: Request) {
  try {
    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json(
        { error: "Expected a JSON body" },
        { status: 400 },
      );
    }

    if (!body || typeof body !== "object") {
      return NextResponse.json(
        { error: "Expected JSON object body" },
        { status: 400 },
      );
    }

    const parsed = InfographicInputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    // 1. Create the run
    const run = await infographicWorkflow.createRun();
    console.log(`🚀 Starting Workflow Run ID: ${run.runId}`);

    // Mastra workflow runs expect { inputData: workflowInput }
    const runResult = await run.start({ inputData: parsed.data });

    // Prefer workflow aggregate `result`, then last step output
    let finalData = null;
    if (runResult.status === "success" && (runResult as any).result != null) {
      finalData = (runResult as any).result;
    }
    const assembleStep = runResult.steps?.["assemble-payload"];
    if (!finalData && assembleStep?.status === "success") {
      finalData = assembleStep.output;
    }

    if (!finalData) {
      console.error(
        "Workflow failed or no output. Run Result:",
        JSON.stringify(runResult, null, 2),
      );
      return NextResponse.json(
        { error: "Workflow failed to produce output" },
        { status: 500 },
      );
    }

    return NextResponse.json(finalData);
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
