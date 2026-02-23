import { eq, desc, and, inArray } from "drizzle-orm";
import { db } from "../index";
import { claudeReviews, claudeReviewFindings } from "../schema";

export async function createClaudeReview(data: {
  pullRequestId: number;
  userId: number;
  scope: string;
  reviewerCount: string;
  dryRun: boolean;
  verifyImplementation: boolean;
  repositoryFullName: string;
  prNumber: number;
  maxIterations?: number;
}) {
  const [review] = await db.insert(claudeReviews).values(data).returning();
  return review;
}

export async function updateClaudeReview(
  id: number,
  data: Partial<{
    status: "pending" | "running" | "completed" | "failed" | "cancelled";
    currentIteration: number;
    maxIterations: number;
    currentPhase: string | null;
    progressPct: number;
    resultStatus: string | null;
    resultBody: string | null;
    filesAnalyzed: number;
    totalFindings: number;
    iterationsCompleted: number;
    errorMessage: string | null;
    rawOutput: string;
    structuredLog: { ts: string; phase: string; message: string }[];
    postedToGithub: boolean;
    postedAt: Date;
    startedAt: Date;
    completedAt: Date;
  }>
) {
  const [review] = await db
    .update(claudeReviews)
    .set(data)
    .where(eq(claudeReviews.id, id))
    .returning();
  return review;
}

export async function getClaudeReviewById(id: number) {
  return db.query.claudeReviews.findFirst({
    where: eq(claudeReviews.id, id),
    with: { findings: true },
  });
}

export async function getRunningReviewForPr(pullRequestId: number) {
  return db.query.claudeReviews.findFirst({
    where: and(
      eq(claudeReviews.pullRequestId, pullRequestId),
      eq(claudeReviews.status, "running")
    ),
  });
}

export async function getReviewHistoryForPr(pullRequestId: number) {
  return db.query.claudeReviews.findMany({
    where: eq(claudeReviews.pullRequestId, pullRequestId),
    orderBy: [desc(claudeReviews.createdAt)],
    with: { findings: true },
  });
}

export async function insertFindings(
  reviewId: number,
  findings: {
    findingHash: string;
    file: string;
    line: number;
    severity: string;
    comment: string;
    suggestion?: string;
    diffContext?: string;
    iteration: number;
  }[]
) {
  if (findings.length === 0) return [];

  const values = findings.map((f) => ({
    reviewId,
    ...f,
  }));

  return db
    .insert(claudeReviewFindings)
    .values(values)
    .onConflictDoNothing()
    .returning();
}

export async function markFindingsPosted(findingIds: number[]) {
  if (findingIds.length === 0) return;

  await db
    .update(claudeReviewFindings)
    .set({ postedToGithub: true })
    .where(inArray(claudeReviewFindings.id, findingIds));
}

export async function markReviewPosted(reviewId: number) {
  await db
    .update(claudeReviews)
    .set({ postedToGithub: true, postedAt: new Date() })
    .where(eq(claudeReviews.id, reviewId));
}

export async function markStaleReviewsFailed() {
  await db
    .update(claudeReviews)
    .set({
      status: "failed",
      errorMessage: "Processus perdu (redémarrage serveur)",
      completedAt: new Date(),
    })
    .where(eq(claudeReviews.status, "running"));
}
