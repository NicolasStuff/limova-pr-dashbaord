import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/db/queries/magic-link-tokens", () => ({
  consumeMagicLinkToken: vi.fn(),
}));

vi.mock("@/lib/db/queries/users", () => ({
  upsertUserByEmail: vi.fn(),
}));

vi.mock("@/lib/auth/session", () => ({
  createSession: vi.fn(),
}));

import { GET } from "@/app/api/auth/verify/route";
import { createSession } from "@/lib/auth/session";
import { consumeMagicLinkToken } from "@/lib/db/queries/magic-link-tokens";
import { upsertUserByEmail } from "@/lib/db/queries/users";

const mockConsumeMagicLinkToken = vi.mocked(consumeMagicLinkToken);
const mockUpsertUserByEmail = vi.mocked(upsertUserByEmail);
const mockCreateSession = vi.mocked(createSession);

describe("GET /api/auth/verify", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    vi.clearAllMocks();

    process.env = {
      ...originalEnv,
      NEXT_PUBLIC_APP_URL: "http://localhost:3000",
      AUTH_ALLOWED_EMAIL_DOMAIN: "limova.ai",
    };

    mockUpsertUserByEmail.mockResolvedValue({
      id: 42,
      email: "user@limova.ai",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
  });

  it("creates a session when token is valid", async () => {
    mockConsumeMagicLinkToken.mockResolvedValue({
      id: 1,
      email: "user@limova.ai",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: new Date(),
    } as never);

    const response = await GET(new Request("http://localhost:3000/api/auth/verify?token=abc123"));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("http://localhost:3000/board");
    expect(mockUpsertUserByEmail).toHaveBeenCalledWith("user@limova.ai");
    expect(mockCreateSession).toHaveBeenCalledWith(42);
  });

  it("rejects invalid or already used token", async () => {
    mockConsumeMagicLinkToken.mockResolvedValueOnce({
      id: 1,
      email: "user@limova.ai",
      tokenHash: "hash",
      expiresAt: new Date(Date.now() + 60_000),
      usedAt: new Date(),
      createdAt: new Date(),
    } as never);
    mockConsumeMagicLinkToken.mockResolvedValueOnce(null);

    const first = await GET(new Request("http://localhost:3000/api/auth/verify?token=abc123"));
    const second = await GET(new Request("http://localhost:3000/api/auth/verify?token=abc123"));

    expect(first.status).toBe(302);
    expect(first.headers.get("location")).toBe("http://localhost:3000/board");
    expect(second.status).toBe(302);
    expect(second.headers.get("location")).toBe(
      "http://localhost:3000/login?error=magic_link_invalid"
    );
  });

  it("rejects expired token", async () => {
    mockConsumeMagicLinkToken.mockResolvedValue(null);

    const response = await GET(new Request("http://localhost:3000/api/auth/verify?token=expired"));

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe(
      "http://localhost:3000/login?error=magic_link_invalid"
    );
    expect(mockUpsertUserByEmail).not.toHaveBeenCalled();
    expect(mockCreateSession).not.toHaveBeenCalled();
  });
});
