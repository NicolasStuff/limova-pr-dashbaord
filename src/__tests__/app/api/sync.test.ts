import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/queries/sync-logs", () => ({
  isSyncRunning: vi.fn(),
  getLatestSyncLog: vi.fn(),
}));

vi.mock("@/lib/github/sync", () => ({
  syncAllRepositories: vi.fn(),
}));

import { POST } from "@/app/api/sync/route";
import { isSyncRunning } from "@/lib/db/queries/sync-logs";
import { syncAllRepositories } from "@/lib/github/sync";

const mockIsSyncRunning = vi.mocked(isSyncRunning);
const mockSyncAllRepositories = vi.mocked(syncAllRepositories);

describe("POST /api/sync", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 409 if sync is already running", async () => {
    mockIsSyncRunning.mockResolvedValue(true);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A sync is already in progress");
  });

  it("starts sync and returns 200 when no sync is running", async () => {
    mockIsSyncRunning.mockResolvedValue(false);
    mockSyncAllRepositories.mockResolvedValue([]);

    const response = await POST();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.status).toBe("started");
    expect(json.message).toBe("Sync started");
  });
});
