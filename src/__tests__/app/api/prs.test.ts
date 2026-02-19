import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// Mock the DB queries module
vi.mock("@/lib/db/queries/prs", () => ({
  getPullRequests: vi.fn(),
}));

import { GET } from "@/app/api/prs/route";
import { getPullRequests } from "@/lib/db/queries/prs";

const mockGetPullRequests = vi.mocked(getPullRequests);

describe("GET /api/prs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns BoardData format with all columns", async () => {
    mockGetPullRequests.mockResolvedValue([
      {
        id: 1,
        repositoryId: 1,
        githubId: "PR_1",
        number: 42,
        title: "Fix bug",
        url: "https://github.com/org/repo/pull/42",
        state: "OPEN",
        isDraft: false,
        column: "ready_for_review",
        authorLogin: "testuser",
        authorAvatarUrl: null,
        reviewDecision: null,
        commentsCount: 0,
        reviewsCount: 0,
        changedFiles: 3,
        additions: 10,
        deletions: 5,
        ciStatus: null,
        labels: [],
        requestedReviewers: [],
        headRef: "fix/bug",
        baseRef: "main",
        githubCreatedAt: new Date("2025-01-01T00:00:00Z"),
        githubUpdatedAt: new Date("2025-01-02T00:00:00Z"),
        mergedAt: null,
        repository: { fullName: "org/repo" },
      },
    ] as never);

    const request = new NextRequest("http://localhost:3000/api/prs");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveProperty("columns");
    expect(json).toHaveProperty("totalCount");
    expect(json.totalCount).toBe(1);
    expect(json.columns).toHaveProperty("draft");
    expect(json.columns).toHaveProperty("ready_for_review");
    expect(json.columns).toHaveProperty("review_in_progress");
    expect(json.columns).toHaveProperty("changes_requested");
    expect(json.columns).toHaveProperty("approved");
    expect(json.columns).toHaveProperty("merged");
    expect(json.columns.ready_for_review).toHaveLength(1);
    expect(json.columns.ready_for_review[0].title).toBe("Fix bug");
  });

  it("returns empty board when no PRs exist", async () => {
    mockGetPullRequests.mockResolvedValue([]);

    const request = new NextRequest("http://localhost:3000/api/prs");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.totalCount).toBe(0);
    for (const col of Object.values(json.columns)) {
      expect(col).toHaveLength(0);
    }
  });

  it("returns 500 when DB query fails", async () => {
    mockGetPullRequests.mockRejectedValue(new Error("DB connection failed"));

    const request = new NextRequest("http://localhost:3000/api/prs");
    const response = await GET(request);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Internal server error");
  });
});
