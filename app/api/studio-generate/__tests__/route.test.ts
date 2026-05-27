import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockStart = vi.fn();
const mockCreateRun = vi.fn(() => ({ runId: "studio-run-1", start: mockStart }));

vi.mock("../../../../src/mastra/workflows/studio-workflow", () => ({
  studioWorkflow: { createRun: mockCreateRun },
}));

const VALID_PAYLOAD = {
  content: {
    title: "Studio Title",
    summary: "Studio summary",
    sections: [
      { type: "metric", heading: "KPI", value: "99", unit: "%", insight: "Near perfect." },
      { type: "takeaway", heading: "Key takeaways", points: ["One", "Two"] },
    ],
    metadata: { confidenceScore: 0.85, reasoning: "test" },
  },
  style: {
    primaryColor: "#0f172a",
    secondaryColor: "#3b82f6",
    accentColor: "#f59e0b",
    fontMood: "modern-sans",
    borderRadius: "0.5rem",
    layoutDensity: "airy",
  },
  qaReport: { isAccurate: true, feedback: "" },
  layoutSpec: {
    canvasWidth: 794,
    canvasHeight: 1123,
    background: { color: "#ffffff", pattern: "none" },
    regions: [
      { id: "banner", type: "banner", x: 0, y: 0, width: 794, height: 120 },
      { id: "s0", type: "stat", x: 0, y: 120, width: 794, height: 200, sectionIndex: 0 },
    ],
  },
  studioConfig: {
    template: "editorial-portrait",
    primaryFont: "modern-sans",
    accentStyle: "rule",
    illustrationStyle: "flat",
    showSourceFooter: true,
  },
};

const WORKFLOW_SUCCESS = { status: "success", result: VALID_PAYLOAD, steps: {} };

function makeRequest(
  body: Record<string, unknown>,
  cookies?: string,
): NextRequest {
  return new NextRequest("http://localhost/api/studio-generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(cookies ? { Cookie: cookies } : {}),
    },
    body: JSON.stringify(body),
  });
}

const BASE_BODY = {
  rawText: "Future of electric vehicles",
  mode: "topic",
  density: "standard",
  narrativeFocus: "data-heavy",
  template: "editorial-portrait",
  primaryFont: "modern-sans",
  accentStyle: "rule",
  illustrationStyle: "none",
  showSourceFooter: true,
};

describe("POST /api/studio-generate — locale propagation", () => {
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

  it("falls back to 'en' for unsupported locale in cookie", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest(BASE_BODY, "locale=de"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "en" }),
    });
  });

  it("respects locale sent in body over cookie", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest({ ...BASE_BODY, locale: "it" }, "locale=en"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "it" }),
    });
  });

  it("parses locale from multi-cookie header", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest(BASE_BODY, "session=xyz; locale=it; theme=dark"));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ locale: "it" }),
    });
  });

  it("forces generateImages=false when illustrationStyle is none", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest({ ...BASE_BODY, illustrationStyle: "none" }));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ generateImages: false }),
    });
  });

  it("forces generateImages=true when illustrationStyle is not none", async () => {
    const { POST } = await import("../route");
    await POST(makeRequest({ ...BASE_BODY, illustrationStyle: "flat" }));
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ generateImages: true }),
    });
  });

  it("returns 200 on success", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest(BASE_BODY));
    expect(res.status).toBe(200);
  });

  it("returns 400 for malformed JSON", async () => {
    const { POST } = await import("../route");
    const req = new NextRequest("http://localhost/api/studio-generate", {
      method: "POST",
      body: "bad",
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
