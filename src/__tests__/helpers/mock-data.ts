import type { GitHubPullRequest } from "@/lib/github/types";
import type { PullRequestCard, PrReview } from "@/types/pr";

export function createMockGitHubPr(
  overrides: Partial<GitHubPullRequest> = {}
): GitHubPullRequest {
  return {
    id: "PR_1",
    number: 42,
    title: "Fix auth flow",
    body: "Fixes the login bug",
    url: "https://github.com/org/repo/pull/42",
    state: "OPEN",
    isDraft: false,
    createdAt: "2025-01-01T00:00:00Z",
    updatedAt: "2025-01-02T00:00:00Z",
    mergedAt: null,
    closedAt: null,
    additions: 10,
    deletions: 5,
    changedFiles: 3,
    headRefName: "fix/auth",
    baseRefName: "main",
    reviewDecision: null,
    author: { login: "testuser", avatarUrl: "https://avatar.test/u" },
    repository: { nameWithOwner: "org/repo" },
    labels: { nodes: [] },
    reviewRequests: { nodes: [] },
    reviews: { totalCount: 0, nodes: [] },
    comments: { totalCount: 0 },
    commits: { nodes: [] },
    ...overrides,
  };
}

export function createMockPullRequestCard(
  overrides: Partial<PullRequestCard> = {}
): PullRequestCard {
  return {
    id: 1,
    repositoryId: 1,
    repositoryFullName: "org/repo",
    githubId: "PR_1",
    number: 42,
    title: "Fix auth flow",
    url: "https://github.com/org/repo/pull/42",
    state: "OPEN",
    isDraft: false,
    column: "ready_for_review",
    authorLogin: "testuser",
    authorAvatarUrl: "https://avatar.test/u",
    reviewDecision: null,
    commentsCount: 2,
    reviewsCount: 1,
    changedFiles: 3,
    additions: 10,
    deletions: 5,
    ciStatus: "SUCCESS",
    labels: ["bug", "urgent"],
    requestedReviewers: [
      { login: "reviewer1", avatarUrl: "https://avatar.test/r1" },
    ],
    headRef: "fix/auth",
    baseRef: "main",
    githubCreatedAt: "2025-01-01T00:00:00Z",
    githubUpdatedAt: "2025-01-02T00:00:00Z",
    mergedAt: null,
    ...overrides,
  };
}

export function createMockPrReview(
  overrides: Partial<PrReview> = {}
): PrReview {
  return {
    id: 1,
    authorLogin: "reviewer1",
    authorAvatarUrl: "https://avatar.test/r1",
    state: "APPROVED",
    body: "LGTM",
    submittedAt: "2025-01-02T00:00:00Z",
    ...overrides,
  };
}
