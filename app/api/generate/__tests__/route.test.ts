import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the workflow so tests don't hit real LLMs
const mockStart = vi.fn();
const mockCreateRun = vi.fn(() => ({ runId: "test-run-1", start: mockStart }));

vi.mock("../../../../src/mastra/workflows/infographic-workflow", () => ({
  infographicWorkflow: { createRun: mockCreateRun },
}));

const VALID_PAYLOAD = {
  content: {
    title: "Test Title",
    summary: "Test summary",
    sections: [
      { type: "metric", heading: "Stat", value: "42", unit: "%", insight: "Big number." },
      { type: "takeaway", heading: "Points", points: ["A", "B"] },
    ],
    metadata: { confidenceScore: 0.9, reasoning: "test" },
  },
  style: {
    primaryColor: "#111827",
    secondaryColor: "#4B5563",
    accentColor: "#2563eb",
    fontMood: "modern-sans",
    borderRadius: "0.5rem",
    layoutDensity: "airy",
  },
  qaReport: { isAccurate: true, feedback: "" },
};

const WORKFLOW_SUCCESS = { status: "success", result: VALID_PAYLOAD, steps: {} };

function makeRequest(
  body: Record<string, unknown>,
  cookies?: string,
): NextRequest {
  return new NextRequest("http://localhost/api/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
  });
}

const BASE_BODY = {
  rawText: "History of the Roman aqueduct",
  mode: "topic",
  density: "standard",
  narrativeFocus: "data-heavy",
  generateImages: false,
};

describe("POST /api/generate — locale propagation", () => {
  beforeEach(() => {
    mockStart.mockReset();
    mockCreateRun.mockClear();
    mockStart.mockResolvedValue(WORKFLOW_SUCCESS);
  });

  it("defaults locale to 'en' when no cookie is present", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest(BASE_BODY));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "en" }),
    });
  });

  it("passes 'it' locale from cookie to workflow", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest(BASE_BODY, "locale=it"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "it" }),
    });
  });

  it("passes 'en' locale from cookie to workflow", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest(BASE_BODY, "locale=en"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "en" }),
    });
  });

  it("falls back to 'en' for an unsupported locale cookie value", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest(BASE_BODY, "locale=fr"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "en" }),
    });
  });

  it("respects locale sent explicitly in body over cookie", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest({ ...BASE_BODY, locale: "it" }, "locale=en"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "it" }),
    });
  });

  it("parses locale from multi-cookie header", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest(BASE_BODY, "theme=dark; locale=it; session=abc"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "it" }),
    });
  });

  it("returns 200 and workflow result on success", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest(BASE_BODY));
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.content.title).toBe("Test Title");
  });

  it("returns 400 for malformed JSON", async () => {
    const { POST } = await import("../route");
    const req = new NextRequest("http://localhost/api/generate", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when required fields are missing", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ rawText: "hi" }));
    expect(res.status).toBe(400);
  });
});
