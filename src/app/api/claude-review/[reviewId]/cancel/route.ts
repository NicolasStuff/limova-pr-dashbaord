import { NextResponse } from "next/server";
import { getUser } from "@/lib/auth";
import { cancelReview } from "@/lib/claude-review/runner";

export async function POST(
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

  await cancelReview(reviewId);

  return NextResponse.json({ success: true });
}
