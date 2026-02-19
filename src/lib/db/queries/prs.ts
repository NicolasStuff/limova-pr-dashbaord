import { eq, and, desc, asc, inArray, or, sql } from "drizzle-orm";
import { db } from "../index";
import { pullRequests, reviews, repositories } from "../schema";
import type { PrColumn } from "@/types/pr";

export interface PrFilters {
  columns?: PrColumn[];
  repositoryIds?: number[];
  authorLogin?: string;
  labels?: string[];
  search?: string;
  sort?: "updated" | "created" | "comments";
  sortDirection?: "asc" | "desc";
  limit?: number;
  offset?: number;
  stale?: boolean;
}

export async function getPullRequests(filters: PrFilters = {}) {
  const conditions = [];

  if (filters.columns && filters.columns.length > 0) {
    conditions.push(inArray(pullRequests.column, filters.columns));
  }

  if (filters.repositoryIds && filters.repositoryIds.length > 0) {
    conditions.push(inArray(pullRequests.repositoryId, filters.repositoryIds));
  }

  if (filters.authorLogin) {
    conditions.push(eq(pullRequests.authorLogin, filters.authorLogin));
  }

  if (filters.labels && filters.labels.length > 0) {
    for (const label of filters.labels) {
      conditions.push(sql`${pullRequests.labels}::jsonb @> ${JSON.stringify([{ name: label }])}::jsonb`);
    }
  }

  if (filters.search) {
    const escaped = filters.search.replace(/[%_\\]/g, "\\$&");
    conditions.push(
      or(
        sql`${pullRequests.title} LIKE ${"%" + escaped + "%"} ESCAPE '\\'`,
        sql`${pullRequests.authorLogin} LIKE ${"%" + escaped + "%"} ESCAPE '\\'`
      )
    );
  }

  if (filters.stale) {
    conditions.push(
      sql`${pullRequests.githubCreatedAt} < NOW() - INTERVAL '3 days'`
    );
    conditions.push(
      sql`${pullRequests.column} != 'merged'`
    );
  }

  const sortColumn = filters.sort === "created"
    ? pullRequests.githubCreatedAt
    : filters.sort === "comments"
      ? pullRequests.commentsCount
      : pullRequests.githubUpdatedAt;

  const sortDir = filters.sortDirection === "asc" ? asc : desc;

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const prs = await db.query.pullRequests.findMany({
    where,
    with: {
      repository: true,
    },
    orderBy: [sortDir(sortColumn)],
    limit: filters.limit ?? 100,
    offset: filters.offset ?? 0,
  });

  return prs;
}

export async function getPullRequestById(id: number) {
  return db.query.pullRequests.findFirst({
    where: eq(pullRequests.id, id),
    with: {
      reviews: {
        orderBy: [desc(reviews.submittedAt)],
      },
      repository: true,
    },
  });
}

export async function getPullRequestByRepoAndNumber(
  repositoryId: number,
  number: number
) {
  return db.query.pullRequests.findFirst({
    where: and(
      eq(pullRequests.repositoryId, repositoryId),
      eq(pullRequests.number, number)
    ),
  });
}

export async function upsertPullRequest(data: {
  repositoryId: number;
  githubId: string;
  number: number;
  title: string;
  body?: string | null;
  url: string;
  state: string;
  isDraft?: boolean;
  column: PrColumn;
  authorLogin: string;
  authorAvatarUrl?: string | null;
  reviewDecision?: string | null;
  commentsCount?: number;
  reviewsCount?: number;
  changedFiles?: number;
  additions?: number;
  deletions?: number;
  ciStatus?: string | null;
  labels?: unknown;
  requestedReviewers?: unknown;
  headRef?: string | null;
  baseRef?: string | null;
  githubCreatedAt: Date;
  githubUpdatedAt: Date;
  mergedAt?: Date | null;
  closedAt?: Date | null;
}) {
  const [pr] = await db
    .insert(pullRequests)
    .values({
      ...data,
      lastSyncedAt: new Date(),
    })
    .onConflictDoUpdate({
      target: [pullRequests.repositoryId, pullRequests.number],
      set: {
        title: data.title,
        body: data.body,
        state: data.state,
        isDraft: data.isDraft,
        column: data.column,
        authorLogin: data.authorLogin,
        authorAvatarUrl: data.authorAvatarUrl,
        reviewDecision: data.reviewDecision,
        commentsCount: data.commentsCount,
        reviewsCount: data.reviewsCount,
        changedFiles: data.changedFiles,
        additions: data.additions,
        deletions: data.deletions,
        ciStatus: data.ciStatus,
        labels: data.labels,
        requestedReviewers: data.requestedReviewers,
        headRef: data.headRef,
        baseRef: data.baseRef,
        githubUpdatedAt: data.githubUpdatedAt,
        mergedAt: data.mergedAt,
        closedAt: data.closedAt,
        updatedAt: new Date(),
        lastSyncedAt: new Date(),
      },
    })
    .returning();
  return pr;
}

export async function upsertReview(data: {
  pullRequestId: number;
  githubId: string;
  authorLogin: string;
  authorAvatarUrl?: string | null;
  state: string;
  body?: string | null;
  submittedAt: Date;
}) {
  const [review] = await db
    .insert(reviews)
    .values(data)
    .onConflictDoUpdate({
      target: [reviews.githubId],
      set: {
        state: data.state,
        body: data.body,
        authorLogin: data.authorLogin,
        authorAvatarUrl: data.authorAvatarUrl,
      },
    })
    .returning();
  return review;
}
