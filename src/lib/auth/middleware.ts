import { jwtVerify } from "jose";
import { SESSION_COOKIE_NAME } from "./config";

const secret = new TextEncoder().encode(process.env.AUTH_SECRET!);

export async function verifySessionToken(token: string): Promise<{ sessionId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, secret);
    return { sessionId: payload.sessionId as string };
  } catch {
    return null;
  }
}

export { SESSION_COOKIE_NAME };
