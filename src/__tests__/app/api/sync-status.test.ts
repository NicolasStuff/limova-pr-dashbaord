import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/db/queries/sync-logs", () => ({
  getLatestSyncLog: vi.fn(),
  isSyncRunning: vi.fn(),
}));

import { GET } from "@/app/api/sync/status/route";
import { getLatestSyncLog, isSyncRunning } from "@/lib/db/queries/sync-logs";

const mockGetLatestSyncLog = vi.mocked(getLatestSyncLog);
const mockIsSyncRunning = vi.mocked(isSyncRunning);

describe("GET /api/sync/status", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns lastSync and isRunning", async () => {
    const mockLog = {
      id: 1,
      repositoryId: null,
      status: "success" as const,
      trigger: "manual",
      prsProcessed: 10,
      prsCreated: 5,
      prsUpdated: 5,
      errorMessage: null,
      durationMs: 1200,
      startedAt: new Date("2025-01-01T00:00:00Z"),
      completedAt: new Date("2025-01-01T00:00:01Z"),
    };
    mockGetLatestSyncLog.mockResolvedValue(mockLog);
    mockIsSyncRunning.mockResolvedValue(false);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty("lastSync");
    expect(json).toHaveProperty("isRunning");
    expect(json.isRunning).toBe(false);
    expect(json.lastSync).not.toBeNull();
  });

  it("returns null lastSync when no sync has run", async () => {
    mockGetLatestSyncLog.mockResolvedValue(undefined);
    mockIsSyncRunning.mockResolvedValue(false);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.lastSync).toBeNull();
    expect(json.isRunning).toBe(false);
  });

  it("returns isRunning true when sync is in progress", async () => {
    mockGetLatestSyncLog.mockResolvedValue(undefined);
    mockIsSyncRunning.mockResolvedValue(true);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.isRunning).toBe(true);
  });
});
