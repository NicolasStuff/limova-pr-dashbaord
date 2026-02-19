import { fetchGitHub } from "./client";
import {
  FETCH_PRS_QUERY,
  FETCH_RECENT_MERGED_QUERY,
  buildOpenPrsSearchQuery,
  buildRecentMergedSearchQuery,
} from "./queries";
import type { GitHubPullRequest, GitHubSearchResponse } from "./types";
import { classifyPr } from "./classifier";
import { getRepositoryById } from "../db/queries/repositories";
import {
  createSyncLog,
  updateSyncLog,
  isSyncRunning,
} from "../db/queries/sync-logs";
import { upsertPullRequest, upsertReview } from "../db/queries/prs";
import { getRepositories } from "../db/queries/repositories";
import { MERGED_PR_RETENTION_DAYS } from "../utils/constants";

export interface SyncResult {
  repositoryId: number;
  repositoryFullName: string;
  status: "success" | "failure";
  prsProcessed: number;
  prsCreated: number;
  prsUpdated: number;
  durationMs: number;
  error?: string;
}

async function fetchAllPrs(
  query: string,
  searchQuery: string
): Promise<GitHubPullRequest[]> {
  const allPrs: GitHubPullRequest[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;

  while (hasNextPage) {
    const variables: Record<string, unknown> = { searchQuery };
    if (cursor) {
      variables.cursor = cursor;
    }

    const response = await fetchGitHub<GitHubSearchResponse>(query, variables);

    const prs = response.search.nodes.filter(
      (node): node is GitHubPullRequest => node !== null && "number" in node
    );
    allPrs.push(...prs);

    hasNextPage = response.search.pageInfo.hasNextPage;
    cursor = response.search.pageInfo.endCursor;
  }

  return allPrs;
}

function getCiStatus(pr: GitHubPullRequest): string | null {
  const lastCommit = pr.commits.nodes[0];
  if (!lastCommit?.commit.statusCheckRollup) return null;
  return lastCommit.commit.statusCheckRollup.state.toLowerCase();
}

export async function syncRepository(
  repositoryId: number,
  trigger: string = "manual"
): Promise<SyncResult> {
  const startTime = Date.now();
  const repo = await getRepositoryById(repositoryId);

  if (!repo) {
    throw new Error(`Repository with id ${repositoryId} not found`);
  }

  const syncLog = await createSyncLog({
    repositoryId,
    status: "running",
    trigger,
  });

  let prsProcessed = 0;
  let prsCreated = 0;
  let prsUpdated = 0;

  try {
    // Fetch open PRs
    const openSearchQuery = buildOpenPrsSearchQuery(repo.fullName);
    const openPrs = await fetchAllPrs(FETCH_PRS_QUERY, openSearchQuery);

    // Fetch recently merged PRs
    const mergedSearchQuery = buildRecentMergedSearchQuery(
      repo.fullName,
      MERGED_PR_RETENTION_DAYS
    );
    const mergedPrs = await fetchAllPrs(
      FETCH_RECENT_MERGED_QUERY,
      mergedSearchQuery
    );

    // Deduplicate by PR number
    const allPrsMap = new Map<number, GitHubPullRequest>();
    for (const pr of [...openPrs, ...mergedPrs]) {
      allPrsMap.set(pr.number, pr);
    }

    const allPrs = Array.from(allPrsMap.values());
    prsProcessed = allPrs.length;

    for (const ghPr of allPrs) {
      const column = classifyPr(ghPr);
      const ciStatus = getCiStatus(ghPr);

      const labels = ghPr.labels.nodes.map((l) => ({
        name: l.name,
        color: l.color,
      }));

      const requestedReviewers = ghPr.reviewRequests.nodes
        .map((rr) => ({
          login: rr.requestedReviewer.login ?? rr.requestedReviewer.name ?? "",
          avatarUrl: rr.requestedReviewer.avatarUrl,
        }))
        .filter((r) => r.login);

      // Total conversations matching GitHub's "Conversation" count:
      // issue comments + inline review comments + reviews with a body
      const inlineReviewComments = ghPr.reviews.nodes.reduce(
        (sum, r) => sum + (r.comments?.totalCount ?? 0),
        0
      );
      const reviewsWithBody = ghPr.reviews.nodes.filter(
        (r) => r.body && r.body.trim().length > 0
      ).length;
      const totalConversations =
        ghPr.comments.totalCount + inlineReviewComments + reviewsWithBody;

      const existingPr = await import("../db/queries/prs").then((m) =>
        m.getPullRequestByRepoAndNumber(repositoryId, ghPr.number)
      );
      const isNew = !existingPr;

      const upsertedPr = await upsertPullRequest({
        repositoryId,
        githubId: ghPr.id,
        number: ghPr.number,
        title: ghPr.title,
        body: ghPr.body,
        url: ghPr.url,
        state: ghPr.state,
        isDraft: ghPr.isDraft,
        column,
        authorLogin: ghPr.author?.login ?? "ghost",
        authorAvatarUrl: ghPr.author?.avatarUrl ?? null,
        reviewDecision: ghPr.reviewDecision,
        commentsCount: totalConversations,
        reviewsCount: ghPr.reviews.totalCount,
        changedFiles: ghPr.changedFiles,
        additions: ghPr.additions,
        deletions: ghPr.deletions,
        ciStatus,
        labels,
        requestedReviewers,
        headRef: ghPr.headRefName,
        baseRef: ghPr.baseRefName,
        githubCreatedAt: new Date(ghPr.createdAt),
        githubUpdatedAt: new Date(ghPr.updatedAt),
        mergedAt: ghPr.mergedAt ? new Date(ghPr.mergedAt) : null,
        closedAt: ghPr.closedAt ? new Date(ghPr.closedAt) : null,
      });

      if (isNew) {
        prsCreated++;
      } else {
        prsUpdated++;
      }

      // Upsert reviews
      for (const ghReview of ghPr.reviews.nodes) {
        if (!ghReview.author) continue;

        await upsertReview({
          pullRequestId: upsertedPr.id,
          githubId: ghReview.id,
          authorLogin: ghReview.author.login,
          authorAvatarUrl: ghReview.author.avatarUrl,
          state: ghReview.state,
          body: ghReview.body,
          submittedAt: new Date(ghReview.submittedAt),
        });
      }
    }

    const durationMs = Date.now() - startTime;

    await updateSyncLog(syncLog.id, {
      status: "success",
      prsProcessed,
      prsCreated,
      prsUpdated,
      durationMs,
      completedAt: new Date(),
    });

    console.log(
      `[Sync] ${repo.fullName}: ${prsProcessed} PRs processed (${prsCreated} created, ${prsUpdated} updated) in ${durationMs}ms`
    );

    return {
      repositoryId,
      repositoryFullName: repo.fullName,
      status: "success",
      prsProcessed,
      prsCreated,
      prsUpdated,
      durationMs,
    };
  } catch (error: unknown) {
    const durationMs = Date.now() - startTime;
    const errorMessage =
      error instanceof Error ? error.message : String(error);

    await updateSyncLog(syncLog.id, {
      status: "failure",
      prsProcessed,
      prsCreated,
      prsUpdated,
      errorMessage,
      durationMs,
      completedAt: new Date(),
    });

    console.error(`[Sync] ${repo.fullName} failed:`, errorMessage);

    return {
      repositoryId,
      repositoryFullName: repo.fullName,
      status: "failure",
      prsProcessed,
      prsCreated,
      prsUpdated,
      durationMs,
      error: errorMessage,
    };
  }
}

export async function syncAllRepositories(
  trigger: string = "manual"
): Promise<SyncResult[]> {
  const running = await isSyncRunning();
  if (running) {
    console.warn("[Sync] A sync is already running. Skipping.");
    return [];
  }

  const repos = await getRepositories();
  console.log(`[Sync] Starting sync for ${repos.length} repositories...`);

  const results: SyncResult[] = [];
  for (const repo of repos) {
    const result = await syncRepository(repo.id, trigger);
    results.push(result);
  }

  const successCount = results.filter((r) => r.status === "success").length;
  console.log(
    `[Sync] Completed: ${successCount}/${results.length} repositories synced successfully`
  );

  return results;
}
