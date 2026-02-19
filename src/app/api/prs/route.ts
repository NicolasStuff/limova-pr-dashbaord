import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getPullRequests } from "@/lib/db/queries/prs";
import type { PrColumn, PullRequestCard, BoardData } from "@/types/pr";
import { COLUMN_ORDER } from "@/lib/utils/constants";

const filtersSchema = z.object({
  columns: z
    .string()
    .optional()
    .transform((v) =>
      v
        ? (v.split(",").filter((c) => COLUMN_ORDER.includes(c as PrColumn)) as PrColumn[])
        : undefined
    ),
  repos: z
    .string()
    .optional()
    .transform((v) =>
      v ? v.split(",").map(Number).filter((n) => !isNaN(n)) : undefined
    ),
  author: z.string().optional(),
  reviewer: z.string().optional(),
  labels: z
    .string()
    .optional()
    .transform((v) => (v ? v.split(",") : undefined)),
  search: z.string().optional(),
  sort: z.enum(["updated", "created", "comments"]).optional(),
  order: z.enum(["asc", "desc"]).optional(),
  stale: z
    .string()
    .optional()
    .transform((v) => v === "true"),
});

function mapPrToCard(pr: Record<string, unknown>): PullRequestCard {
  const repo = pr.repository as Record<string, unknown> | undefined;
  const labels = (pr.labels ?? []) as Array<Record<string, string>>;
  const requestedReviewers = (pr.requestedReviewers ?? []) as Array<{
    login: string;
    avatarUrl: string;
  }>;

  return {
    id: pr.id as number,
    repositoryId: pr.repositoryId as number,
    repositoryFullName: (repo?.fullName as string) ?? "",
    githubId: pr.githubId as string,
    number: pr.number as number,
    title: pr.title as string,
    url: pr.url as string,
    state: pr.state as string,
    isDraft: (pr.isDraft as boolean) ?? false,
    column: pr.column as PrColumn,
    authorLogin: pr.authorLogin as string,
    authorAvatarUrl: (pr.authorAvatarUrl as string) ?? null,
    reviewDecision: (pr.reviewDecision as string) ?? null,
    commentsCount: (pr.commentsCount as number) ?? 0,
    reviewsCount: (pr.reviewsCount as number) ?? 0,
    changedFiles: (pr.changedFiles as number) ?? 0,
    additions: (pr.additions as number) ?? 0,
    deletions: (pr.deletions as number) ?? 0,
    ciStatus: (pr.ciStatus as string) ?? null,
    labels: labels.map((l) => l.name),
    requestedReviewers,
    headRef: (pr.headRef as string) ?? null,
    baseRef: (pr.baseRef as string) ?? null,
    githubCreatedAt:
      pr.githubCreatedAt instanceof Date
        ? (pr.githubCreatedAt as Date).toISOString()
        : String(pr.githubCreatedAt),
    githubUpdatedAt:
      pr.githubUpdatedAt instanceof Date
        ? (pr.githubUpdatedAt as Date).toISOString()
        : String(pr.githubUpdatedAt),
    mergedAt: pr.mergedAt
      ? pr.mergedAt instanceof Date
        ? (pr.mergedAt as Date).toISOString()
        : String(pr.mergedAt)
      : null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const params = Object.fromEntries(searchParams.entries());
    const parsed = filtersSchema.safeParse(params);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid query parameters", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { columns, repos, author, labels, search, sort, order, stale } = parsed.data;

    const prs = await getPullRequests({
      columns,
      repositoryIds: repos,
      authorLogin: author,
      labels,
      search,
      sort,
      sortDirection: order,
      stale,
    });

    // Group PRs by column
    const columnData: Record<PrColumn, PullRequestCard[]> = {
      draft: [],
      ready_for_review: [],
      review_in_progress: [],
      changes_requested: [],
      approved: [],
      merged: [],
    };

    for (const pr of prs) {
      const card = mapPrToCard(pr as unknown as Record<string, unknown>);
      columnData[card.column].push(card);
    }

    const boardData: BoardData = {
      columns: columnData,
      totalCount: prs.length,
    };

    return NextResponse.json(boardData);
  } catch (error) {
    console.error("[API] GET /api/prs error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
