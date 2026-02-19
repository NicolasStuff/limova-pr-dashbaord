import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/magic-link-tokens", () => ({
  createMagicLinkToken: vi.fn(),
  invalidateActiveMagicLinkTokensByEmail: vi.fn(),
}));

vi.mock("@/lib/email/resend", () => ({
  sendMagicLinkEmail: vi.fn(),
}));

import { POST } from "@/app/api/auth/login/route";
import { hashMagicLinkToken } from "@/lib/auth/magic-link";
import {
  createMagicLinkToken,
  invalidateActiveMagicLinkTokensByEmail,
} from "@/lib/db/queries/magic-link-tokens";
import { sendMagicLinkEmail } from "@/lib/email/resend";

const mockCreateMagicLinkToken = vi.mocked(createMagicLinkToken);
const mockInvalidateActiveTokensByEmail = vi.mocked(invalidateActiveMagicLinkTokensByEmail);
const mockSendMagicLinkEmail = vi.mocked(sendMagicLinkEmail);

describe("POST /api/auth/login", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      AUTH_ALLOWED_EMAIL_DOMAIN: "limova.ai",
      MAGIC_LINK_TTL_MINUTES: "15",
    };

    mockCreateMagicLinkToken.mockResolvedValue({
      id: 1,
      email: "user@limova.ai",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      usedAt: null,
      createdAt: new Date(),
    } as never);

    mockSendMagicLinkEmail.mockResolvedValue({} as never);
  });

  it("creates token and sends a magic link for allowed email domain", async () => {
    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: new URLSearchParams({ email: "User@Limova.ai" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?status=magic_link_sent"
    );

    expect(mockInvalidateActiveTokensByEmail).toHaveBeenCalledWith("user@limova.ai");
    expect(mockCreateMagicLinkToken).toHaveBeenCalledTimes(1);
    expect(mockSendMagicLinkEmail).toHaveBeenCalledTimes(1);
    expect(mockSendMagicLinkEmail).toHaveBeenCalledWith("user@limova.ai", expect.any(String));

    const sentToken = mockSendMagicLinkEmail.mock.calls[0][1];
    const savedTokenHash = mockCreateMagicLinkToken.mock.calls[0][0].tokenHash;
    expect(savedTokenHash).toBe(hashMagicLinkToken(sentToken));
  });

  it("rejects unauthorized domains", async () => {
    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: new URLSearchParams({ email: "user@gmail.com" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=invalid_domain"
    );
    expect(mockInvalidateActiveTokensByEmail).not.toHaveBeenCalled();
    expect(mockCreateMagicLinkToken).not.toHaveBeenCalled();
    expect(mockSendMagicLinkEmail).not.toHaveBeenCalled();
  });

  it("rejects invalid email format", async () => {
    const request = new Request("http://localhost:3000/api/auth/login", {
      method: "POST",
      body: new URLSearchParams({ email: "not-an-email" }),
    });

    const response = await POST(request);

    expect(response.status).toBe(303);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=invalid_email"
    );
    expect(mockInvalidateActiveTokensByEmail).not.toHaveBeenCalled();
    expect(mockCreateMagicLinkToken).not.toHaveBeenCalled();
    expect(mockSendMagicLinkEmail).not.toHaveBeenCalled();
  });
});
