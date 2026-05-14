/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextResponse } from "next/server";
import { infographicWorkflow } from "../../../src/mastra/workflows/infographic-workflow";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const { runId, start } = await infographicWorkflow.createRun();
    console.log(`Starting Workflow Run ID: ${runId}`);

    const runResult = await start(body);

    const assembleStep = runResult.steps?.["assemble-payload"];

    let finalData = null;

    if (assembleStep?.status === "success") {
      finalData = assembleStep.output;
    } else if (runResult.status === "success") {
      finalData = (runResult as any).result;
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
