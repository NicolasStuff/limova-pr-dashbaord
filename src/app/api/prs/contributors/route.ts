import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pullRequests, reviews } from "@/lib/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  try {
    // Unique authors from PRs
    const authors = await db
      .selectDistinctOn([pullRequests.authorLogin], {
        login: pullRequests.authorLogin,
        avatarUrl: pullRequests.authorAvatarUrl,
      })
      .from(pullRequests)
      .orderBy(pullRequests.authorLogin);

    // Unique reviewers from reviews table
    const reviewersFromReviews = await db
      .selectDistinctOn([reviews.authorLogin], {
        login: reviews.authorLogin,
        avatarUrl: reviews.authorAvatarUrl,
      })
      .from(reviews)
      .orderBy(reviews.authorLogin);

    // Unique requested reviewers from JSONB field
    const requestedReviewersRaw = await db.execute<{
      login: string;
      avatar_url: string;
    }>(sql`
      SELECT DISTINCT
        r->>'login' as login,
        r->>'avatarUrl' as avatar_url
      FROM pull_requests,
        jsonb_array_elements(requested_reviewers) AS r
      WHERE r->>'login' IS NOT NULL AND r->>'login' != ''
      ORDER BY login
    `);

    // Merge all reviewers into a deduplicated map
    const reviewerMap = new Map<string, string | null>();
    for (const r of reviewersFromReviews) {
      reviewerMap.set(r.login, r.avatarUrl);
    }
    for (const r of requestedReviewersRaw) {
      if (!reviewerMap.has(r.login)) {
        reviewerMap.set(r.login, r.avatar_url);
      }
    }

    const allReviewers = Array.from(reviewerMap.entries())
      .map(([login, avatarUrl]) => ({ login, avatarUrl }))
      .sort((a, b) => a.login.localeCompare(b.login));

    return NextResponse.json({ authors, reviewers: allReviewers });
  } catch (error) {
    console.error("[API] GET /api/prs/contributors error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
