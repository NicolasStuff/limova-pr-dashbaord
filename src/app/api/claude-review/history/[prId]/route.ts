import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getReviewHistoryForPr } from "@/lib/db/queries/claude-reviews";
import type { ReviewHistoryItem, ReviewScope } from "@/types/claude-review";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ prId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { prId: prIdStr } = await params;
  const pullRequestId = parseInt(prIdStr, 10);
  if (isNaN(pullRequestId)) {
    return NextResponse.json({ error: "Invalid PR ID" }, { status: 400 });
  }

  const reviews = await getReviewHistoryForPr(pullRequestId);

  const history: ReviewHistoryItem[] = reviews.map((r) => ({
    id: r.id,
    status: r.status,
    scope: r.scope as ReviewScope,
    dryRun: r.dryRun,
    resultStatus: r.resultStatus ?? null,
    totalFindings: r.totalFindings ?? 0,
    iterationsCompleted: r.iterationsCompleted ?? 0,
    postedToGithub: r.postedToGithub ?? false,
    createdAt: r.createdAt?.toISOString() ?? new Date().toISOString(),
    completedAt: r.completedAt?.toISOString() ?? null,
  }));

  return NextResponse.json(history);
}
