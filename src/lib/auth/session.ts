import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE } from "./config";
import { createDbSession, getSessionWithUser, deleteDbSession, extendSession } from "../db/queries/sessions";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function createSession(userId: number): Promise<string> {
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);

  await createDbSession({ id: sessionId, userId, expiresAt });

  const token = await new SignJWT({ sessionId })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime(expiresAt)
    .sign(secret);

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });

  return sessionId;
}

export async function validateSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, secret);
    const sessionId = payload.sessionId as string;

    const result = await getSessionWithUser(sessionId);
    if (!result) return null;

    const { session, user } = result;

    if (session.expiresAt < new Date()) {
      await deleteDbSession(sessionId);
      return null;
    }

    // Sliding window: extend if past 50% of lifetime
    const halfLife = SESSION_MAX_AGE * 1000 / 2;
    const timeRemaining = session.expiresAt.getTime() - Date.now();
    if (timeRemaining < halfLife) {
      const newExpiresAt = new Date(Date.now() + SESSION_MAX_AGE * 1000);
      await extendSession(sessionId, newExpiresAt);

      // Refresh JWT cookie
      const newToken = await new SignJWT({ sessionId })
        .setProtectedHeader({ alg: "HS256" })
        .setExpirationTime(newExpiresAt)
        .sign(secret);

      cookieStore.set(SESSION_COOKIE_NAME, newToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: SESSION_MAX_AGE,
      });
    }

    return { session, user };
  } catch {
    return null;
  }
}

export async function invalidateSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;

  if (token) {
    try {
      const { payload } = await jwtVerify(token, secret);
      const sessionId = payload.sessionId as string;
      await deleteDbSession(sessionId);
    } catch {
      // Token invalide, on supprime quand même le cookie
    }
  }

  cookieStore.delete(SESSION_COOKIE_NAME);
}
