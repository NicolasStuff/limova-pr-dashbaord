export type PrColumn =
  | "draft"
  | "ready_for_review"
  | "review_in_progress"
  | "changes_requested"
  | "approved"
  | "merged";

export interface PullRequestCard {
  id: number;
  repositoryId: number;
  repositoryFullName: string;
  githubId: string;
  number: number;
  title: string;
  url: string;
  state: string;
  isDraft: boolean;
  column: PrColumn;
  authorLogin: string;
  authorAvatarUrl: string | null;
  reviewDecision: string | null;
  commentsCount: number;
  reviewsCount: number;
  changedFiles: number;
  additions: number;
  deletions: number;
  ciStatus: string | null;
  labels: string[];
  requestedReviewers: { login: string; avatarUrl: string }[];
  headRef: string | null;
  baseRef: string | null;
  githubCreatedAt: string;
  githubUpdatedAt: string;
  mergedAt: string | null;
}

export interface PrReview {
  id: number;
  authorLogin: string;
  authorAvatarUrl: string | null;
  state: string;
  body: string | null;
  submittedAt: string;
}

export interface BoardData {
  columns: Record<PrColumn, PullRequestCard[]>;
  totalCount: number;
}
