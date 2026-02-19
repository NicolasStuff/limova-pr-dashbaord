import crypto from "crypto";
import { classifyPr } from "./classifier";
import type { GitHubPullRequest } from "./types";
import {
  upsertPullRequest,
  upsertReview,
  getPullRequestByRepoAndNumber,
} from "../db/queries/prs";
import { getRepositoryByFullName } from "../db/queries/repositories";

export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const hmac = crypto.createHmac("sha256", secret);
  const digest = `sha256=${hmac.update(payload).digest("hex")}`;
  try {
    return crypto.timingSafeEqual(
      Buffer.from(digest),
      Buffer.from(signature)
    );
  } catch {
    return false;
  }
}

export async function handleWebhookEvent(
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  switch (event) {
    case "pull_request":
      await handlePullRequestEvent(payload);
      break;
    case "pull_request_review":
      await handlePullRequestReviewEvent(payload);
      break;
    case "pull_request_review_comment":
      await handlePullRequestReviewCommentEvent(payload);
      break;
    default:
      console.log(`[Webhook] Ignoring event: ${event}`);
  }
}

async function handlePullRequestEvent(
  payload: Record<string, unknown>
): Promise<void> {
  const prData = payload.pull_request as Record<string, unknown> | undefined;
  const repoData = payload.repository as Record<string, unknown> | undefined;

  if (!prData || !repoData) {
    console.error("[Webhook] Missing pull_request or repository in payload");
    return;
  }

  const repoFullName = repoData.full_name as string;
  const repo = await getRepositoryByFullName(repoFullName);

  if (!repo) {
    console.warn(`[Webhook] Repository ${repoFullName} not tracked, skipping`);
    return;
  }

  // Build a minimal GitHubPullRequest-like object for classification
  const ghPr = mapWebhookPrToGitHubPr(prData);
  const column = classifyPr(ghPr);

  const user = prData.user as Record<string, unknown> | undefined;
  const head = prData.head as Record<string, unknown> | undefined;
  const base = prData.base as Record<string, unknown> | undefined;

  await upsertPullRequest({
    repositoryId: repo.id,
    githubId: String(prData.node_id ?? prData.id),
    number: prData.number as number,
    title: prData.title as string,
    body: (prData.body as string) ?? null,
    url: prData.html_url as string,
    state: mapWebhookState(prData),
    isDraft: (prData.draft as boolean) ?? false,
    column,
    authorLogin: (user?.login as string) ?? "ghost",
    authorAvatarUrl: (user?.avatar_url as string) ?? null,
    reviewDecision: null,
    commentsCount:
      ((prData.comments as number) ?? 0) +
      ((prData.review_comments as number) ?? 0),
    reviewsCount: 0,
    changedFiles: (prData.changed_files as number) ?? 0,
    additions: (prData.additions as number) ?? 0,
    deletions: (prData.deletions as number) ?? 0,
    ciStatus: null,
    labels: ((prData.labels as Array<Record<string, unknown>>) ?? []).map(
      (l) => ({ name: l.name as string, color: l.color as string })
    ),
    requestedReviewers: (
      (prData.requested_reviewers as Array<Record<string, unknown>>) ?? []
    ).map((r) => ({
      login: r.login as string,
      avatarUrl: r.avatar_url as string,
    })),
    headRef: (head?.ref as string) ?? null,
    baseRef: (base?.ref as string) ?? null,
    githubCreatedAt: new Date(prData.created_at as string),
    githubUpdatedAt: new Date(prData.updated_at as string),
    mergedAt: prData.merged_at ? new Date(prData.merged_at as string) : null,
    closedAt: prData.closed_at ? new Date(prData.closed_at as string) : null,
  });

  console.log(
    `[Webhook] PR #${prData.number} in ${repoFullName} upserted (column: ${column})`
  );
}

async function handlePullRequestReviewEvent(
  payload: Record<string, unknown>
): Promise<void> {
  const reviewData = payload.review as Record<string, unknown> | undefined;
  const prData = payload.pull_request as Record<string, unknown> | undefined;
  const repoData = payload.repository as Record<string, unknown> | undefined;

  if (!reviewData || !prData || !repoData) {
    console.error("[Webhook] Missing review, pull_request, or repository");
    return;
  }

  const repoFullName = repoData.full_name as string;
  const repo = await getRepositoryByFullName(repoFullName);

  if (!repo) {
    console.warn(`[Webhook] Repository ${repoFullName} not tracked, skipping`);
    return;
  }

  const existingPr = await getPullRequestByRepoAndNumber(
    repo.id,
    prData.number as number
  );

  if (!existingPr) {
    console.warn(
      `[Webhook] PR #${prData.number} not found in DB for review upsert`
    );
    return;
  }

  const user = reviewData.user as Record<string, unknown> | undefined;

  await upsertReview({
    pullRequestId: existingPr.id,
    githubId: String(reviewData.node_id ?? reviewData.id),
    authorLogin: (user?.login as string) ?? "ghost",
    authorAvatarUrl: (user?.avatar_url as string) ?? null,
    state: (reviewData.state as string).toUpperCase(),
    body: (reviewData.body as string) ?? null,
    submittedAt: new Date(reviewData.submitted_at as string),
  });

  // Reclassify parent PR
  const ghPr = mapWebhookPrToGitHubPr(prData);
  const column = classifyPr(ghPr);
  const prUser = prData.user as Record<string, unknown> | undefined;
  const head = prData.head as Record<string, unknown> | undefined;
  const base = prData.base as Record<string, unknown> | undefined;

  await upsertPullRequest({
    repositoryId: repo.id,
    githubId: String(prData.node_id ?? prData.id),
    number: prData.number as number,
    title: prData.title as string,
    body: (prData.body as string) ?? null,
    url: prData.html_url as string,
    state: mapWebhookState(prData),
    isDraft: (prData.draft as boolean) ?? false,
    column,
    authorLogin: (prUser?.login as string) ?? "ghost",
    authorAvatarUrl: (prUser?.avatar_url as string) ?? null,
    githubCreatedAt: new Date(prData.created_at as string),
    githubUpdatedAt: new Date(prData.updated_at as string),
    mergedAt: prData.merged_at ? new Date(prData.merged_at as string) : null,
    closedAt: prData.closed_at ? new Date(prData.closed_at as string) : null,
    headRef: (head?.ref as string) ?? null,
    baseRef: (base?.ref as string) ?? null,
  });

  console.log(
    `[Webhook] Review on PR #${prData.number} in ${repoFullName} processed`
  );
}

async function handlePullRequestReviewCommentEvent(
  payload: Record<string, unknown>
): Promise<void> {
  const prData = payload.pull_request as Record<string, unknown> | undefined;
  const repoData = payload.repository as Record<string, unknown> | undefined;

  if (!prData || !repoData) {
    console.error("[Webhook] Missing pull_request or repository");
    return;
  }

  const repoFullName = repoData.full_name as string;
  const repo = await getRepositoryByFullName(repoFullName);

  if (!repo) return;

  const existingPr = await getPullRequestByRepoAndNumber(
    repo.id,
    prData.number as number
  );

  if (!existingPr) return;

  // Recalculate comment count from webhook data
  const commentsCount =
    ((prData.comments as number) ?? 0) +
    ((prData.review_comments as number) ?? 0);

  const prUser = prData.user as Record<string, unknown> | undefined;
  const head = prData.head as Record<string, unknown> | undefined;
  const base = prData.base as Record<string, unknown> | undefined;

  await upsertPullRequest({
    repositoryId: repo.id,
    githubId: String(prData.node_id ?? prData.id),
    number: prData.number as number,
    title: prData.title as string,
    body: (prData.body as string) ?? null,
    url: prData.html_url as string,
    state: mapWebhookState(prData),
    isDraft: (prData.draft as boolean) ?? false,
    column: existingPr.column as "draft" | "ready_for_review" | "review_in_progress" | "changes_requested" | "approved" | "merged",
    authorLogin: (prUser?.login as string) ?? "ghost",
    authorAvatarUrl: (prUser?.avatar_url as string) ?? null,
    commentsCount,
    githubCreatedAt: new Date(prData.created_at as string),
    githubUpdatedAt: new Date(prData.updated_at as string),
    mergedAt: prData.merged_at ? new Date(prData.merged_at as string) : null,
    closedAt: prData.closed_at ? new Date(prData.closed_at as string) : null,
    headRef: (head?.ref as string) ?? null,
    baseRef: (base?.ref as string) ?? null,
  });

  console.log(
    `[Webhook] Comment on PR #${prData.number} in ${repoFullName}, count updated`
  );
}

function mapWebhookState(prData: Record<string, unknown>): string {
  if (prData.merged === true || prData.merged_at) return "MERGED";
  const state = (prData.state as string)?.toUpperCase();
  if (state === "CLOSED") return "CLOSED";
  return "OPEN";
}

function mapWebhookPrToGitHubPr(
  prData: Record<string, unknown>
): GitHubPullRequest {
  const user = prData.user as Record<string, unknown> | undefined;
  const head = prData.head as Record<string, unknown> | undefined;
  const base = prData.base as Record<string, unknown> | undefined;
  const headRepo = head?.repo as Record<string, unknown> | undefined;

  return {
    id: String(prData.node_id ?? prData.id),
    number: prData.number as number,
    title: prData.title as string,
    body: (prData.body as string) ?? null,
    url: prData.html_url as string,
    state: mapWebhookState(prData) as "OPEN" | "CLOSED" | "MERGED",
    isDraft: (prData.draft as boolean) ?? false,
    createdAt: prData.created_at as string,
    updatedAt: prData.updated_at as string,
    mergedAt: (prData.merged_at as string) ?? null,
    closedAt: (prData.closed_at as string) ?? null,
    additions: (prData.additions as number) ?? 0,
    deletions: (prData.deletions as number) ?? 0,
    changedFiles: (prData.changed_files as number) ?? 0,
    headRefName: (head?.ref as string) ?? "",
    baseRefName: (base?.ref as string) ?? "",
    reviewDecision: null,
    author: user
      ? { login: user.login as string, avatarUrl: user.avatar_url as string }
      : null,
    repository: {
      nameWithOwner:
        (headRepo?.full_name as string) ?? "",
    },
    labels: {
      nodes: (
        (prData.labels as Array<Record<string, unknown>>) ?? []
      ).map((l) => ({
        name: l.name as string,
        color: l.color as string,
      })),
    },
    reviewRequests: {
      nodes: (
        (prData.requested_reviewers as Array<Record<string, unknown>>) ?? []
      ).map((r) => ({
        requestedReviewer: {
          login: r.login as string,
          avatarUrl: r.avatar_url as string,
        },
      })),
    },
    reviews: {
      totalCount: 0,
      nodes: [],
    },
    comments: {
      totalCount:
        ((prData.comments as number) ?? 0) +
        ((prData.review_comments as number) ?? 0),
    },
    commits: {
      nodes: [],
    },
  };
}
