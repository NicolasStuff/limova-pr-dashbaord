import {
  createMagicLinkToken as createRawMagicLinkToken,
  getMagicLinkExpiryDate,
  hasAllowedEmailDomain,
  hashMagicLinkToken,
  isValidEmailFormat,
  normalizeEmail,
} from "@/lib/auth/magic-link";
import {
  createMagicLinkToken,
  invalidateActiveMagicLinkTokensByEmail,
} from "@/lib/db/queries/magic-link-tokens";
import { sendMagicLinkEmail } from "@/lib/email/resend";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function redirectToLogin(params: Record<string, string>) {
  const loginUrl = new URL("/login", APP_URL);
  Object.entries(params).forEach(([key, value]) => {
    loginUrl.searchParams.set(key, value);
  });
  return Response.redirect(loginUrl, 303);
}

export async function POST(request: Request) {
  const formData = await request.formData();
  const rawEmail = formData.get("email");

  if (typeof rawEmail !== "string") {
    return redirectToLogin({ error: "invalid_email" });
  }

  const email = normalizeEmail(rawEmail);

  if (!isValidEmailFormat(email)) {
    return redirectToLogin({ error: "invalid_email" });
  }

  if (!hasAllowedEmailDomain(email)) {
    return redirectToLogin({ error: "invalid_domain" });
  }

  try {
    await invalidateActiveMagicLinkTokensByEmail(email);

    const token = createRawMagicLinkToken();
    const tokenHash = hashMagicLinkToken(token);
    const expiresAt = getMagicLinkExpiryDate();

    await createMagicLinkToken({
      email,
      tokenHash,
      expiresAt,
    });

    await sendMagicLinkEmail(email, token);

    return redirectToLogin({ status: "magic_link_sent" });
  } catch (error) {
    console.error("Unable to send magic link:", error);
    return redirectToLogin({ error: "send_failed" });
  }
}
