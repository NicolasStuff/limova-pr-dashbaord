import { NextRequest, NextResponse } from "next/server";
import { getPullRequestById } from "@/lib/db/queries/prs";
import type { PrColumn, PullRequestCard, PrReview } from "@/types/pr";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prId = Number(id);

    if (isNaN(prId)) {
      return NextResponse.json(
        { error: "Invalid PR id" },
        { status: 400 }
      );
    }

    const pr = await getPullRequestById(prId);

    if (!pr) {
      return NextResponse.json(
        { error: "Pull request not found" },
        { status: 404 }
      );
    }

    const repo = pr.repository;
    const labels = (pr.labels ?? []) as Array<Record<string, string>>;
    const requestedReviewers = (pr.requestedReviewers ?? []) as Array<{
      login: string;
      avatarUrl: string;
    }>;

    const card: PullRequestCard = {
      id: pr.id,
      repositoryId: pr.repositoryId,
      repositoryFullName: repo?.fullName ?? "",
      githubId: pr.githubId,
      number: pr.number,
      title: pr.title,
      url: pr.url,
      state: pr.state,
      isDraft: pr.isDraft ?? false,
      column: pr.column as PrColumn,
      authorLogin: pr.authorLogin,
      authorAvatarUrl: pr.authorAvatarUrl ?? null,
      reviewDecision: pr.reviewDecision ?? null,
      commentsCount: pr.commentsCount ?? 0,
      reviewsCount: pr.reviewsCount ?? 0,
      changedFiles: pr.changedFiles ?? 0,
      additions: pr.additions ?? 0,
      deletions: pr.deletions ?? 0,
      ciStatus: pr.ciStatus ?? null,
      labels: labels.map((l) => l.name),
      requestedReviewers,
      headRef: pr.headRef ?? null,
      baseRef: pr.baseRef ?? null,
      githubCreatedAt: pr.githubCreatedAt.toISOString(),
      githubUpdatedAt: pr.githubUpdatedAt.toISOString(),
      mergedAt: pr.mergedAt ? pr.mergedAt.toISOString() : null,
    };

    const reviews: PrReview[] = (pr.reviews ?? []).map((r) => ({
      id: r.id,
      authorLogin: r.authorLogin,
      authorAvatarUrl: r.authorAvatarUrl ?? null,
      state: r.state,
      body: r.body ?? null,
      submittedAt: r.submittedAt.toISOString(),
    }));

    return NextResponse.json({ ...card, reviews });
  } catch (error) {
    console.error("[API] GET /api/prs/[id] error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
