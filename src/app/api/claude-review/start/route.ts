import { NextResponse } from "next/server";
import { z } from "zod";
import { existsSync } from "fs";
import { eq } from "drizzle-orm";
import { getUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import {
  createClaudeReview,
  getRunningReviewForPr,
} from "@/lib/db/queries/claude-reviews";
import { runReviewBackground } from "@/lib/claude-review/runner";
import type { ReviewScope } from "@/types/claude-review";

const MAX_ITERATIONS = 5;

const startSchema = z.object({
  prNumber: z.number().int().positive(),
  repositoryFullName: z.string().min(1),
  pullRequestId: z.number().int().positive(),
  reviewerCount: z.union([z.literal("auto"), z.number().int().min(1).max(10)]),
  dryRun: z.boolean(),
  verifyImplementation: z.boolean(),
});

function resolveScope(repositoryFullName: string): ReviewScope {
  const repoName = repositoryFullName.split("/").pop()?.toLowerCase() ?? "";
  if (repoName.includes("client")) return "client";
  return "api";
}

export async function POST(request: Request) {
  const user = await getUser();
  if (!user) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = startSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid parameters", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { prNumber, repositoryFullName, pullRequestId, reviewerCount, dryRun, verifyImplementation } =
    parsed.data;

  // Check for running review on this PR (DB-based lock)
  const running = await getRunningReviewForPr(pullRequestId);
  if (running) {
    return NextResponse.json(
      { error: "A review is already in progress for this PR", reviewId: running.id },
      { status: 409 }
    );
  }

  // Get repoBasePath
  const [userRow] = await db
    .select({ repoBasePath: users.repoBasePath })
    .from(users)
    .where(eq(users.id, user.id))
    .limit(1);

  const repoBasePath = userRow?.repoBasePath;
  if (!repoBasePath) {
    return NextResponse.json(
      { error: "Repo base path not configured. Please set it in settings." },
      { status: 400 }
    );
  }

  const scope = resolveScope(repositoryFullName);
  const cwd = `${repoBasePath}/${scope}`;

  if (!existsSync(cwd)) {
    return NextResponse.json(
      { error: `Directory not found: ${cwd}` },
      { status: 400 }
    );
  }

  // Create review row in DB
  const review = await createClaudeReview({
    pullRequestId,
    userId: user.id,
    scope,
    reviewerCount: String(reviewerCount),
    dryRun,
    verifyImplementation,
    repositoryFullName,
    prNumber,
    maxIterations: MAX_ITERATIONS,
  });

  // Fire-and-forget background execution
  runReviewBackground(review.id, {
    repoBasePath,
    prNumber,
    repositoryFullName,
    scope,
    reviewerCount: String(reviewerCount),
    verifyImplementation,
    maxIterations: MAX_ITERATIONS,
  }).catch(() => {
    // Errors are handled inside the runner
  });

  return NextResponse.json({ reviewId: review.id });
}
