import { NextRequest, NextResponse } from "next/server";
import { getPullRequestById } from "@/lib/db/queries/prs";
import { fetchPrChecks } from "@/lib/github/checks";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const prId = parseInt(id, 10);
    if (isNaN(prId)) {
      return NextResponse.json({ error: "Invalid PR ID" }, { status: 400 });
    }

    const pr = await getPullRequestById(prId);
    if (!pr) {
      return NextResponse.json({ error: "PR not found" }, { status: 404 });
    }

    const [owner, name] = pr.repository.fullName.split("/");
    const checks = await fetchPrChecks(owner, name, pr.number);

    return NextResponse.json(checks);
  } catch (error) {
    console.error("[API] Error fetching PR checks:", error);
    return NextResponse.json(
      { error: "Failed to fetch checks" },
      { status: 500 }
    );
  }
}
