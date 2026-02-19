import { NextResponse } from "next/server";
import { getLatestSyncLog, isSyncRunning } from "@/lib/db/queries/sync-logs";

export async function GET() {
  try {
    const [lastSync, isRunning] = await Promise.all([
      getLatestSyncLog(),
      isSyncRunning(),
    ]);

    return NextResponse.json({
      lastSync: lastSync ?? null,
      isRunning,
    });
  } catch (error) {
    console.error("[API] GET /api/sync/status error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
