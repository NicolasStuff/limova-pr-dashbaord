import { eq } from "drizzle-orm";
import { db } from "..";
import { sessions, users } from "../schema";

export async function createDbSession(data: { id: string; userId: number; expiresAt: Date }) {
  const [session] = await db.insert(sessions).values(data).returning();
  return session;
}

export async function getSessionWithUser(sessionId: string) {
  const result = await db
    .select({
      session: sessions,
      user: users,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.id, sessionId))
    .limit(1);
  return result[0] ?? null;
}

export async function deleteDbSession(sessionId: string) {
  await db.delete(sessions).where(eq(sessions.id, sessionId));
}

export async function extendSession(sessionId: string, newExpiresAt: Date) {
  await db.update(sessions).set({ expiresAt: newExpiresAt }).where(eq(sessions.id, sessionId));
}
