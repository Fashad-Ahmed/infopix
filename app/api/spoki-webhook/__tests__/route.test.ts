import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { createHmac } from "crypto";

// ---------- capture after() promise ----------
let capturedAfterPromise: Promise<unknown> | null = null;

vi.mock("next/server", async (importOriginal) => {
  const actual = await importOriginal<typeof import("next/server")>();
  return {
    ...actual,
    after: vi.fn((p: Promise<unknown>) => {
      capturedAfterPromise = p;
    }),
  };
});

// ---------- workflow mock ----------
const mockStart = vi.fn();
const mockCreateRun = vi.fn(() => ({ start: mockStart }));

vi.mock("../../../../src/mastra/workflows/infographic-workflow", () => ({
  infographicWorkflow: { createRun: mockCreateRun },
}));

// ---------- helpers ----------
const WEBHOOK_SECRET = "test-signing-secret";

function makeRequest(body: unknown, extraHeaders?: Record<string, string>): NextRequest {
  return new NextRequest("http://localhost/api/spoki-webhook", {
    method: "POST",
    headers: { "Content-Type": "application/json", ...extraHeaders },
    body: JSON.stringify(body),
  });
}

function makeSignedRequest(body: unknown, secret = WEBHOOK_SECRET): NextRequest {
  const rawBody = JSON.stringify(body);
  const timestamp = Math.floor(Date.now() / 1000).toString();
  const payload = `${timestamp}.${rawBody}`;
  const sig = createHmac("sha256", secret).update(payload).digest("hex");
  return new NextRequest("http://localhost/api/spoki-webhook", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-spoki-signature": `t=${timestamp},v2=${sig}`,
    },
    body: rawBody,
  });
}

const MOCK_WORKFLOW_SUCCESS = {
  status: "success",
  result: {
    content: {
      title: "Test Title",
      summary: "Test summary of findings.",
      sections: [
        {
          type: "metric",
          heading: "Key Stat",
          value: "42",
          unit: "%",
          insight: "Significant increase year-over-year.",
        },
        { type: "takeaway", heading: "Key Points", points: ["Point A", "Point B"] },
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
  },
  steps: {},
};

// ---------- tests ----------
describe("POST /api/spoki-webhook", () => {
  beforeEach(async () => {
    capturedAfterPromise = null;
    mockStart.mockReset();
    mockCreateRun.mockClear();
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, text: async () => "" }));
    vi.stubEnv("SPOKI_API_KEY", "test-key-abc");
    vi.stubEnv("SPOKI_AUTOMATION_URL", "https://api.spoki.com/wh/ap/test-automation-id");
    vi.stubEnv("SPOKI_AUTOMATION_SECRET", "test-automation-secret");
    vi.stubEnv("SPOKI_WEBHOOK_SECRET", ""); // no auth by default
    const { after } = await import("next/server");
    vi.mocked(after).mockClear();
  });

  // --- payload parsing: Spoki v2 format ---

  it("parses Spoki v2 nested payload (data.from_phone + data.text)", async () => {
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({
        version: 2,
        event: "message.inbound",
        data: { from_phone: "+393319989152", text: "Hello from v2", type: "Text" },
      }),
    );
    expect(res.status).toBe(200);
    const { after } = await import("next/server");
    expect(after).toHaveBeenCalledOnce();
  });

  it("passes correct phone and message from v2 payload to workflow", async () => {
    mockStart.mockResolvedValue(MOCK_WORKFLOW_SUCCESS);
    const { POST } = await import("../route");
    await POST(
      makeRequest({
        version: 2,
        event: "message.inbound",
        data: { from_phone: "+393319989152", text: "https://github.com/nestjs/nest" },
      }),
    );
    await capturedAfterPromise;
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({
        rawText: "https://r.jina.ai/https://github.com/nestjs/nest",
        density: "standard",
        narrativeFocus: "data-heavy",
      }),
    });
  });

  it("passes plain text message without Jina proxy", async () => {
    mockStart.mockResolvedValue(MOCK_WORKFLOW_SUCCESS);
    const { POST } = await import("../route");
    await POST(
      makeRequest({
        version: 2,
        event: "message.inbound",
        data: { from_phone: "+393319989152", text: "Tell me about AI trends and their impact on enterprise software in 2024" },
      }),
    );
    await capturedAfterPromise;
    expect(mockStart).toHaveBeenCalledWith({
      inputData: expect.objectContaining({ rawText: "Tell me about AI trends and their impact on enterprise software in 2024" }),
    });
  });

  // --- legacy flat payload still works ---

  it("still accepts legacy flat payload (phone + message)", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ phone: "+1234567890", message: "hello" }));
    expect(res.status).toBe(200);
  });

  it("accepts legacy contact_id + text aliases", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ contact_id: "+1234567890", text: "hello" }));
    expect(res.status).toBe(200);
  });

  // --- validation ---

  it("returns 400 on malformed JSON", async () => {
    const { POST } = await import("../route");
    const req = new NextRequest("http://localhost/api/spoki-webhook", {
      method: "POST",
      body: "not-json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 400 when phone is missing", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ data: { text: "hello" } }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when message is missing", async () => {
    const { POST } = await import("../route");
    const res = await POST(makeRequest({ data: { from_phone: "+1234567890" } }));
    expect(res.status).toBe(400);
  });

  // --- immediate ACK ---

  it("returns 200 immediately — response does not await workflow completion", async () => {
    mockStart.mockReturnValue(new Promise(() => {})); // never resolves
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({ data: { from_phone: "+1234567890", text: "hello" } }),
    );
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    const { after } = await import("next/server");
    expect(after).toHaveBeenCalledOnce();
  });

  // --- HMAC signature verification ---

  it("accepts request with valid X-Spoki-Signature when secret is set", async () => {
    vi.stubEnv("SPOKI_WEBHOOK_SECRET", WEBHOOK_SECRET);
    const { POST } = await import("../route");
    const res = await POST(
      makeSignedRequest({ data: { from_phone: "+1234567890", text: "hello" } }),
    );
    expect(res.status).toBe(200);
  });

  it("rejects request with invalid signature when secret is set", async () => {
    vi.stubEnv("SPOKI_WEBHOOK_SECRET", WEBHOOK_SECRET);
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest(
        { data: { from_phone: "+1234567890", text: "hello" } },
        { "x-spoki-signature": "t=12345,v2=badhash" },
      ),
    );
    expect(res.status).toBe(401);
  });

  it("rejects request with no signature header when secret is set", async () => {
    vi.stubEnv("SPOKI_WEBHOOK_SECRET", WEBHOOK_SECRET);
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({ data: { from_phone: "+1234567890", text: "hello" } }),
    );
    expect(res.status).toBe(401);
  });

  it("allows request with no signature when secret is NOT set", async () => {
    vi.stubEnv("SPOKI_WEBHOOK_SECRET", "");
    const { POST } = await import("../route");
    const res = await POST(
      makeRequest({ data: { from_phone: "+1234567890", text: "hello" } }),
    );
    expect(res.status).toBe(200);
  });

  // --- Spoki outbound ---

  it("sends formatted message to Spoki for the correct phone", async () => {
    mockStart.mockResolvedValue(MOCK_WORKFLOW_SUCCESS);
    const { POST } = await import("../route");
    await POST(
      makeRequest({
        version: 2,
        data: { from_phone: "+393319989152", text: "some text input that is long enough to pass validation checks here" },
      }),
    );
    await capturedAfterPromise;

    const callArgs = vi.mocked(fetch).mock.calls[0]!;
    const sentBody = JSON.parse(callArgs[1]!.body as string) as { phone: string; custom_fields: Record<string, string> };
    expect(sentBody.phone).toBe("+393319989152");
    expect(sentBody.custom_fields.CUSTOM_FIELD_1).toContain("*Test Title*");
  });

  it("sends secret in request body (not Authorization header) in Spoki outbound call", async () => {
    mockStart.mockResolvedValue(MOCK_WORKFLOW_SUCCESS);
    const { POST } = await import("../route");
    await POST(
      makeRequest({
        version: 2,
        data: { from_phone: "+1234567890", text: "some text input that is long enough to pass validation checks here" },
      }),
    );
    await capturedAfterPromise;
    const callArgs = vi.mocked(fetch).mock.calls[0]!;
    const sentBody = JSON.parse(callArgs[1]!.body as string) as { secret: string; phone: string; custom_fields: Record<string, string> };
    expect(sentBody.secret).toBe("test-automation-secret");
    expect(sentBody.phone).toBe("+1234567890");
    expect(sentBody.custom_fields.CUSTOM_FIELD_1).toBeTruthy();
  });

  it("sends help message for short non-URL messages", async () => {
    const { POST } = await import("../route");
    await POST(
      makeRequest({ version: 2, data: { from_phone: "+1234567890", text: "Hello" } }),
    );
    await capturedAfterPromise;

    expect(mockStart).not.toHaveBeenCalled();
    const callArgs = vi.mocked(fetch).mock.calls[0]!;
    const sentBody = JSON.parse(callArgs[1]!.body as string) as { custom_fields: Record<string, string> };
    expect(sentBody.custom_fields.CUSTOM_FIELD_1).toContain("InfoPix Bot");
  });

  it("runs workflow for short URL (URLs bypass length guard)", async () => {
    mockStart.mockResolvedValue(MOCK_WORKFLOW_SUCCESS);
    const { POST } = await import("../route");
    await POST(
      makeRequest({ version: 2, data: { from_phone: "+1234567890", text: "https://example.com" } }),
    );
    await capturedAfterPromise;
    expect(mockStart).toHaveBeenCalled();
  });

  // --- error resilience ---

  it("does not throw when workflow rejects", async () => {
    mockStart.mockRejectedValue(new Error("LLM timeout"));
    const { POST } = await import("../route");
    await POST(makeRequest({ data: { from_phone: "+1234567890", text: "some long enough text that passes the fifty character minimum guard check" } }));
    await expect(capturedAfterPromise).resolves.toBeUndefined();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("does not throw when Spoki send fails", async () => {
    mockStart.mockResolvedValue(MOCK_WORKFLOW_SUCCESS);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, text: async () => "Unauthorized" }),
    );
    const { POST } = await import("../route");
    await POST(makeRequest({ data: { from_phone: "+1234567890", text: "some long enough text that passes the fifty character minimum guard check" } }));
    await expect(capturedAfterPromise).resolves.toBeUndefined();
  });

  it("does not call Spoki when SPOKI_AUTOMATION_URL is not set", async () => {
    vi.stubEnv("SPOKI_AUTOMATION_URL", "");
    mockStart.mockResolvedValue(MOCK_WORKFLOW_SUCCESS);
    const { POST } = await import("../route");
    await POST(makeRequest({ data: { from_phone: "+1234567890", text: "some long enough text that passes the fifty character minimum guard check" } }));
    await capturedAfterPromise;
    expect(fetch).not.toHaveBeenCalled();
  });
});
