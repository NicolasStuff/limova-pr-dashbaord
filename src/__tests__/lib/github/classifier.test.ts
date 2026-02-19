import { describe, it, expect } from "vitest";
import { classifyPr } from "@/lib/github/classifier";
import { createMockGitHubPr } from "../../helpers/mock-data";

describe("classifyPr", () => {
  it('returns "merged" when PR state is MERGED', () => {
    const pr = createMockGitHubPr({ state: "MERGED", mergedAt: "2025-01-03T00:00:00Z" });
    expect(classifyPr(pr)).toBe("merged");
  });

  it('returns "draft" when PR is a draft', () => {
    const pr = createMockGitHubPr({ isDraft: true });
    expect(classifyPr(pr)).toBe("draft");
  });

  it('returns "approved" when reviewDecision is APPROVED', () => {
    const pr = createMockGitHubPr({ reviewDecision: "APPROVED" });
    expect(classifyPr(pr)).toBe("approved");
  });

  it('returns "changes_requested" when reviewDecision is CHANGES_REQUESTED', () => {
    const pr = createMockGitHubPr({ reviewDecision: "CHANGES_REQUESTED" });
    expect(classifyPr(pr)).toBe("changes_requested");
  });

  it('returns "review_in_progress" when there is COMMENTED review activity', () => {
    const pr = createMockGitHubPr({
      reviews: {
        totalCount: 1,
        nodes: [
          {
            id: "REV_1",
            author: { login: "reviewer", avatarUrl: "https://avatar.test/r" },
            state: "COMMENTED",
            body: "Looks interesting",
            submittedAt: "2025-01-02T00:00:00Z",
            comments: { totalCount: 0 },
          },
        ],
      },
    });
    expect(classifyPr(pr)).toBe("review_in_progress");
  });

  it('returns "review_in_progress" when there is APPROVED review in nodes but no reviewDecision set', () => {
    const pr = createMockGitHubPr({
      reviewDecision: null,
      reviews: {
        totalCount: 1,
        nodes: [
          {
            id: "REV_2",
            author: { login: "reviewer", avatarUrl: "https://avatar.test/r" },
            state: "APPROVED",
            body: null,
            submittedAt: "2025-01-02T00:00:00Z",
            comments: { totalCount: 0 },
          },
        ],
      },
    });
    expect(classifyPr(pr)).toBe("review_in_progress");
  });

  it('returns "ready_for_review" when PR has pending reviewers', () => {
    const pr = createMockGitHubPr({
      reviewRequests: {
        nodes: [
          {
            requestedReviewer: {
              login: "reviewer1",
              avatarUrl: "https://avatar.test/r1",
            },
          },
        ],
      },
    });
    expect(classifyPr(pr)).toBe("ready_for_review");
  });

  it('returns "ready_for_review" when reviewDecision is REVIEW_REQUIRED', () => {
    const pr = createMockGitHubPr({ reviewDecision: "REVIEW_REQUIRED" });
    expect(classifyPr(pr)).toBe("ready_for_review");
  });

  it('returns "ready_for_review" by default (open, not draft, no reviews)', () => {
    const pr = createMockGitHubPr();
    expect(classifyPr(pr)).toBe("ready_for_review");
  });

  // Edge cases
  it("merged wins over draft (merged + draft)", () => {
    const pr = createMockGitHubPr({
      state: "MERGED",
      isDraft: true,
      mergedAt: "2025-01-03T00:00:00Z",
    });
    expect(classifyPr(pr)).toBe("merged");
  });

  it("draft wins over approved (draft + approved)", () => {
    const pr = createMockGitHubPr({
      isDraft: true,
      reviewDecision: "APPROVED",
    });
    expect(classifyPr(pr)).toBe("draft");
  });

  it("merged wins over approved (merged + approved)", () => {
    const pr = createMockGitHubPr({
      state: "MERGED",
      reviewDecision: "APPROVED",
      mergedAt: "2025-01-03T00:00:00Z",
    });
    expect(classifyPr(pr)).toBe("merged");
  });

  it('returns "review_in_progress" for CHANGES_REQUESTED in nodes with null reviewDecision', () => {
    const pr = createMockGitHubPr({
      reviewDecision: null,
      reviews: {
        totalCount: 1,
        nodes: [
          {
            id: "REV_3",
            author: { login: "reviewer", avatarUrl: "https://avatar.test/r" },
            state: "CHANGES_REQUESTED",
            body: "Needs fixes",
            submittedAt: "2025-01-02T00:00:00Z",
            comments: { totalCount: 0 },
          },
        ],
      },
    });
    expect(classifyPr(pr)).toBe("review_in_progress");
  });

  it("ignores PENDING/DISMISSED review states for review activity", () => {
    const pr = createMockGitHubPr({
      reviews: {
        totalCount: 1,
        nodes: [
          {
            id: "REV_4",
            author: { login: "reviewer", avatarUrl: "https://avatar.test/r" },
            state: "PENDING",
            body: null,
            submittedAt: "2025-01-02T00:00:00Z",
            comments: { totalCount: 0 },
          },
        ],
      },
    });
    // PENDING review state does not count as "review activity"
    expect(classifyPr(pr)).toBe("ready_for_review");
  });
});
