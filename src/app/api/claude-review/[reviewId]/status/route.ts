import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { getClaudeReviewById } from "@/lib/db/queries/claude-reviews";
import type { ClaudeReviewStatus, ReviewScope, StructuredLogEntry } from "@/types/claude-review";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ reviewId: string }> }
) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  const { reviewId: reviewIdStr } = await params;
  const reviewId = parseInt(reviewIdStr, 10);
  if (isNaN(reviewId)) {
    return NextResponse.json({ error: "Invalid review ID" }, { status: 400 });
  }

  const review = await getClaudeReviewById(reviewId);
  if (!review) {
    return NextResponse.json({ error: "Review not found" }, { status: 404 });
  }

  const response: ClaudeReviewStatus = {
    id: review.id,
    status: review.status,
    scope: review.scope as ReviewScope,
    dryRun: review.dryRun,
    currentIteration: review.currentIteration ?? 0,
    maxIterations: review.maxIterations ?? 5,
    currentPhase: review.currentPhase ?? null,
    progressPct: review.progressPct ?? 0,
    totalFindings: review.totalFindings ?? 0,
    resultStatus: review.resultStatus as ClaudeReviewStatus["resultStatus"],
    resultBody: review.resultBody ?? null,
    filesAnalyzed: review.filesAnalyzed ?? 0,
    iterationsCompleted: review.iterationsCompleted ?? 0,
    errorMessage: review.errorMessage ?? null,
    rawOutput: (review.rawOutput as string) ?? "",
    structuredLog: (review.structuredLog ?? []) as StructuredLogEntry[],
    postedToGithub: review.postedToGithub ?? false,
    startedAt: review.startedAt?.toISOString() ?? null,
    completedAt: review.completedAt?.toISOString() ?? null,
    createdAt: review.createdAt?.toISOString() ?? new Date().toISOString(),
    findings: (review.findings ?? []).map((f) => ({
      id: f.findingHash,
      dbId: f.id,
      file: f.file,
      line: f.line,
      severity: f.severity as "blocking" | "major" | "minor" | "cosmetic",
      comment: f.comment,
      suggestion: f.suggestion ?? undefined,
      diffContext: f.diffContext ?? undefined,
      iteration: f.iteration,
      posted: f.postedToGithub ?? false,
    })),
  };

  return NextResponse.json(response);
}
