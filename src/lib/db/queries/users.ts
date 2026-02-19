import { eq } from "drizzle-orm";
import { db } from "..";
import { users } from "../schema";

export async function getUserByEmail(email: string) {
  const [user] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return user ?? null;
}

export async function upsertUserByEmail(email: string) {
  const [user] = await db
    .insert(users)
    .values({ email })
    .onConflictDoUpdate({
      target: users.email,
      set: {
        updatedAt: new Date(),
      },
    })
    .returning();

  return user;
}
