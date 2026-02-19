import { eq, desc, and } from "drizzle-orm";
import { db } from "../index";
import { syncLogs } from "../schema";

export async function getLatestSyncLog() {
  return db.query.syncLogs.findFirst({
    orderBy: [desc(syncLogs.startedAt)],
  });
}

export async function getLatestSyncLogByRepo(repositoryId: number) {
  return db.query.syncLogs.findFirst({
    where: eq(syncLogs.repositoryId, repositoryId),
    orderBy: [desc(syncLogs.startedAt)],
  });
}

export async function createSyncLog(data: {
  repositoryId?: number;
  status: "running" | "success" | "failure";
  trigger: string;
}) {
  const [log] = await db.insert(syncLogs).values(data).returning();
  return log;
}

export async function updateSyncLog(
  id: number,
  data: Partial<{
    status: "running" | "success" | "failure";
    prsProcessed: number;
    prsCreated: number;
    prsUpdated: number;
    errorMessage: string;
    durationMs: number;
    completedAt: Date;
  }>
) {
  const [log] = await db
    .update(syncLogs)
    .set(data)
    .where(eq(syncLogs.id, id))
    .returning();
  return log;
}

export async function isSyncRunning() {
  const running = await db.query.syncLogs.findFirst({
    where: and(eq(syncLogs.status, "running")),
    orderBy: [desc(syncLogs.startedAt)],
  });
  return !!running;
}
