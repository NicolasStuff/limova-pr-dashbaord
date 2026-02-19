import { NextResponse } from "next/server";
import { syncAllRepositories } from "@/lib/github/sync";
import { isSyncRunning } from "@/lib/db/queries/sync-logs";

export async function POST() {
  try {
    const running = await isSyncRunning();
    if (running) {
      return NextResponse.json(
        { error: "A sync is already in progress" },
        { status: 409 }
      );
    }

    // Launch sync in background (non-blocking)
    syncAllRepositories("manual")
      .then((results) => {
        const successCount = results.filter((r) => r.status === "success").length;
        console.log(`[API] Background sync completed: ${successCount}/${results.length} succeeded`);
      })
      .catch((err) => {
        console.error("[API] Background sync failed:", err);
      });

    return NextResponse.json({ status: "started", message: "Sync started" });
  } catch (error) {
    console.error("[API] POST /api/sync error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
