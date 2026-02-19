import type { PrColumn } from "@/types/pr";
import type { GitHubPullRequest } from "./types";

export function classifyPr(pr: GitHubPullRequest): PrColumn {
  // 1. Merged PRs
  if (pr.state === "MERGED") {
    return "merged";
  }

  // 2. Draft PRs
  if (pr.isDraft) {
    return "draft";
  }

  // 3. Approved
  if (pr.reviewDecision === "APPROVED") {
    return "approved";
  }

  // 4. Changes requested
  if (pr.reviewDecision === "CHANGES_REQUESTED") {
    return "changes_requested";
  }

  // 5. Has review activity (at least one non-pending review submitted)
  const hasReviewActivity =
    pr.reviews.nodes.length > 0 &&
    pr.reviews.nodes.some(
      (r) =>
        r.state === "APPROVED" ||
        r.state === "CHANGES_REQUESTED" ||
        r.state === "COMMENTED"
    );

  if (hasReviewActivity) {
    return "review_in_progress";
  }

  // 6. Has pending reviewers or review required
  const hasPendingReviewers = pr.reviewRequests.nodes.length > 0;
  if (hasPendingReviewers || pr.reviewDecision === "REVIEW_REQUIRED") {
    return "ready_for_review";
  }

  // 7. Default
  return "ready_for_review";
}
