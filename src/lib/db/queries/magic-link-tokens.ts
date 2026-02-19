import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "..";
import { magicLinkTokens } from "../schema";

export async function invalidateActiveMagicLinkTokensByEmail(email: string) {
  await db
    .update(magicLinkTokens)
    .set({ usedAt: new Date() })
    .where(and(eq(magicLinkTokens.email, email), isNull(magicLinkTokens.usedAt)));
}

export async function createMagicLinkToken(data: {
  email: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  const [token] = await db.insert(magicLinkTokens).values(data).returning();
  return token;
}

export async function consumeMagicLinkToken(tokenHash: string) {
  const now = new Date();
  const [token] = await db
    .update(magicLinkTokens)
    .set({ usedAt: now })
    .where(
      and(
        eq(magicLinkTokens.tokenHash, tokenHash),
        isNull(magicLinkTokens.usedAt),
        gt(magicLinkTokens.expiresAt, now)
      )
    )
    .returning();

  return token ?? null;
}
