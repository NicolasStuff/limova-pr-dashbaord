import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import crypto from "crypto";

vi.mock("@/lib/github/webhook-handler", () => ({
  verifyWebhookSignature: vi.fn(),
  handleWebhookEvent: vi.fn(),
}));

import { POST } from "@/app/api/webhooks/github/route";
import {
  verifyWebhookSignature,
  handleWebhookEvent,
} from "@/lib/github/webhook-handler";

const mockVerifyWebhookSignature = vi.mocked(verifyWebhookSignature);
const mockHandleWebhookEvent = vi.mocked(handleWebhookEvent);

describe("POST /api/webhooks/github", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv, GITHUB_WEBHOOK_SECRET: "test-secret" };
  });

  it("returns 400 when signature header is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/webhooks/github",
      {
        method: "POST",
        body: JSON.stringify({ action: "opened" }),
        headers: {
          "Content-Type": "application/json",
          "x-github-event": "pull_request",
        },
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Missing required headers");
  });

  it("returns 400 when event header is missing", async () => {
    const request = new NextRequest(
      "http://localhost:3000/api/webhooks/github",
      {
        method: "POST",
        body: JSON.stringify({ action: "opened" }),
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=abc123",
        },
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Missing required headers");
  });

  it("returns 401 when signature is invalid", async () => {
    mockVerifyWebhookSignature.mockReturnValue(false);

    const request = new NextRequest(
      "http://localhost:3000/api/webhooks/github",
      {
        method: "POST",
        body: JSON.stringify({ action: "opened" }),
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=invalid",
          "x-github-event": "pull_request",
        },
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(401);
    expect(json.error).toBe("Invalid signature");
  });

  it("returns 200 for valid ping event", async () => {
    mockVerifyWebhookSignature.mockReturnValue(true);

    const request = new NextRequest(
      "http://localhost:3000/api/webhooks/github",
      {
        method: "POST",
        body: JSON.stringify({ zen: "test" }),
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=valid",
          "x-github-event": "ping",
        },
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.received).toBe(true);
  });

  it("processes pull_request event and returns 200", async () => {
    mockVerifyWebhookSignature.mockReturnValue(true);
    mockHandleWebhookEvent.mockResolvedValue(undefined);

    const request = new NextRequest(
      "http://localhost:3000/api/webhooks/github",
      {
        method: "POST",
        body: JSON.stringify({ action: "opened", pull_request: {} }),
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=valid",
          "x-github-event": "pull_request",
        },
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.received).toBe(true);
    expect(mockHandleWebhookEvent).toHaveBeenCalledWith(
      "pull_request",
      expect.any(Object)
    );
  });

  it("returns 500 when webhook secret is not configured", async () => {
    delete process.env.GITHUB_WEBHOOK_SECRET;

    const request = new NextRequest(
      "http://localhost:3000/api/webhooks/github",
      {
        method: "POST",
        body: JSON.stringify({ action: "opened" }),
        headers: {
          "Content-Type": "application/json",
          "x-hub-signature-256": "sha256=abc",
          "x-github-event": "pull_request",
        },
      }
    );

    const response = await POST(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Webhook secret not configured");
  });
});

describe("verifyWebhookSignature (unit)", () => {
  it("returns true for a valid signature", async () => {
    // Import the real function (not mocked)
    const { verifyWebhookSignature: realVerify } = await vi.importActual<
      typeof import("@/lib/github/webhook-handler")
    >("@/lib/github/webhook-handler");

    const secret = "my-secret";
    const payload = '{"test":"data"}';
    const hmac = crypto.createHmac("sha256", secret);
    const expectedSig = `sha256=${hmac.update(payload).digest("hex")}`;

    expect(realVerify(payload, expectedSig, secret)).toBe(true);
  });

  it("returns false for an invalid signature", async () => {
    const { verifyWebhookSignature: realVerify } = await vi.importActual<
      typeof import("@/lib/github/webhook-handler")
    >("@/lib/github/webhook-handler");

    expect(realVerify('{"test":"data"}', "sha256=wrong", "my-secret")).toBe(
      false
    );
  });
});
