export interface GitHubPageInfo {
  hasNextPage: boolean;
  endCursor: string | null;
}

export interface GitHubActor {
  login: string;
  avatarUrl: string;
}

export interface GitHubLabel {
  name: string;
  color: string;
}

export interface GitHubReviewRequest {
  requestedReviewer: {
    login?: string;
    name?: string;
    avatarUrl: string;
  };
}

export interface GitHubReview {
  id: string;
  author: GitHubActor | null;
  state: string;
  body: string | null;
  submittedAt: string;
  comments: {
    totalCount: number;
  };
}

export interface GitHubStatusCheckRollup {
  state: "SUCCESS" | "FAILURE" | "PENDING" | "ERROR" | "EXPECTED";
}

export interface GitHubCommitNode {
  commit: {
    statusCheckRollup: GitHubStatusCheckRollup | null;
  };
}

export interface GitHubPullRequest {
  id: string;
  number: number;
  title: string;
  body: string | null;
  url: string;
  state: "OPEN" | "CLOSED" | "MERGED";
  isDraft: boolean;
  createdAt: string;
  updatedAt: string;
  mergedAt: string | null;
  closedAt: string | null;
  additions: number;
  deletions: number;
  changedFiles: number;
  headRefName: string;
  baseRefName: string;
  reviewDecision: "APPROVED" | "CHANGES_REQUESTED" | "REVIEW_REQUIRED" | null;
  author: GitHubActor | null;
  repository: {
    nameWithOwner: string;
  };
  labels: {
    nodes: GitHubLabel[];
  };
  reviewRequests: {
    nodes: GitHubReviewRequest[];
  };
  reviews: {
    totalCount: number;
    nodes: GitHubReview[];
  };
  comments: {
    totalCount: number;
  };
  commits: {
    nodes: GitHubCommitNode[];
  };
}

export interface GitHubSearchResponse {
  search: {
    pageInfo: GitHubPageInfo;
    nodes: GitHubPullRequest[];
  };
}
