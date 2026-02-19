import { createSession } from "@/lib/auth/session";
import { consumeMagicLinkToken } from "@/lib/db/queries/magic-link-tokens";
import { upsertUserByEmail } from "@/lib/db/queries/users";
import { hashMagicLinkToken, hasAllowedEmailDomain, isValidEmailFormat } from "@/lib/auth/magic-link";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectToLoginError(error: string) {
  const url = new URL("/login", APP_URL);
  url.searchParams.set("error", error);
  return Response.redirect(url);
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return redirectToLoginError("magic_link_invalid");
  }

  try {
    const tokenHash = hashMagicLinkToken(token);
    const magicLinkToken = await consumeMagicLinkToken(tokenHash);

    if (!magicLinkToken) {
      return redirectToLoginError("magic_link_invalid");
    }

    if (!isValidEmailFormat(magicLinkToken.email) || !hasAllowedEmailDomain(magicLinkToken.email)) {
      return redirectToLoginError("magic_link_invalid");
    }

    const user = await upsertUserByEmail(magicLinkToken.email);
    await createSession(user.id);

    return Response.redirect(new URL("/board", APP_URL));
  } catch (error) {
    console.error("Magic link verification failed:", error);
    return redirectToLoginError("magic_link_invalid");
  }
}
