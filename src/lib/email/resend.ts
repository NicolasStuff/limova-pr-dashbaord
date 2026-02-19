import { Resend } from "resend";
import { MAGIC_LINK_TTL_MINUTES } from "@/lib/auth/config";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error("RESEND_API_KEY is not configured");
  }

  return new Resend(apiKey);
}

export function buildMagicLinkUrl(token: string) {
  const url = new URL("/api/auth/verify", APP_URL);
  url.searchParams.set("token", token);
  return url.toString();
}

function buildMagicLinkHtml(magicLinkUrl: string) {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="dark">
  <meta name="supported-color-schemes" content="dark">
  <title>Connexion Limova</title>
  <!--[if mso]>
  <style>
    table, td { font-family: Arial, sans-serif !important; }
  </style>
  <![endif]-->
</head>
<body style="margin:0;padding:0;background-color:#070b14;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;-webkit-font-smoothing:antialiased;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#070b14;min-height:100vh;">
    <tr>
      <td align="center" style="padding:40px 16px;">

        <!-- Main card -->
        <table role="presentation" width="480" cellpadding="0" cellspacing="0" border="0" style="max-width:480px;width:100%;background-color:#111827;border-radius:12px;border:1px solid #1e293b;box-shadow:0 0 24px rgba(59,130,246,0.08),0 4px 32px rgba(0,0,0,0.4);">

          <!-- Header with glow accent -->
          <tr>
            <td style="padding:0;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:3px;background:linear-gradient(90deg,transparent,#3b82f6,transparent);font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Logo section -->
          <tr>
            <td align="center" style="padding:40px 40px 0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td align="center">
                    <p style="margin:0 0 6px 0;font-family:'Courier New',monospace;font-size:10px;font-weight:400;text-transform:uppercase;letter-spacing:0.3em;color:#64748b;">Mission Control</p>
                    <p style="margin:0;font-family:'Courier New',monospace;font-size:22px;font-weight:700;text-transform:uppercase;letter-spacing:0.25em;color:#e2e8f0;">LIMOVA</p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:1px;background-color:#1e293b;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0 0 8px 0;font-size:18px;font-weight:600;color:#e2e8f0;line-height:1.4;">
                Prêt à vous connecter
              </p>
              <p style="margin:0 0 32px 0;font-size:14px;color:#94a3b8;line-height:1.6;">
                Cliquez sur le bouton ci-dessous pour accéder à votre dashboard. Ce lien est à usage unique et expire dans ${MAGIC_LINK_TTL_MINUTES}&nbsp;minutes.
              </p>
            </td>
          </tr>

          <!-- CTA Button -->
          <tr>
            <td align="center" style="padding:0 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="width:100%;">
                <tr>
                  <td align="center" style="border-radius:8px;background-color:#3b82f6;">
                    <a href="${magicLinkUrl}" target="_blank" style="display:block;padding:14px 32px;font-family:'IBM Plex Sans',-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;font-weight:600;color:#ffffff;text-decoration:none;text-align:center;border-radius:8px;">
                      Se connecter &rarr;
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Fallback link -->
          <tr>
            <td style="padding:20px 40px 0 40px;">
              <p style="margin:0;font-size:11px;color:#64748b;line-height:1.5;word-break:break-all;">
                Si le bouton ne fonctionne pas, copiez ce lien&nbsp;:<br>
                <a href="${magicLinkUrl}" style="color:#3b82f6;text-decoration:underline;">${magicLinkUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Security notice -->
          <tr>
            <td style="padding:32px 40px 0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0f1a;border-radius:8px;border:1px solid #162032;">
                <tr>
                  <td style="padding:14px 16px;">
                    <p style="margin:0;font-size:12px;color:#64748b;line-height:1.5;">
                      &#128274;&ensp;Vous n'avez pas demandé ce lien&nbsp;? Ignorez simplement cet email. Personne ne peut accéder à votre compte sans ce lien.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:32px 40px 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="height:1px;background-color:#1e293b;font-size:0;line-height:0;">&nbsp;</td>
                </tr>
              </table>
              <p style="margin:16px 0 0 0;font-family:'Courier New',monospace;font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:0.2em;color:#334155;text-align:center;">
                Limova &middot; Code Review Dashboard
              </p>
            </td>
          </tr>

        </table>
        <!-- End main card -->

      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendMagicLinkEmail(email: string, token: string) {
  const resend = getResendClient();
  const from = process.env.AUTH_EMAIL_FROM || "Limova <no-reply@limova.ai>";
  const magicLinkUrl = buildMagicLinkUrl(token);

  const result = await resend.emails.send({
    from,
    to: email,
    subject: "Votre lien de connexion Limova",
    text: `Connectez-vous à Limova\n\nCliquez sur ce lien pour accéder à votre dashboard :\n${magicLinkUrl}\n\nCe lien est valable ${MAGIC_LINK_TTL_MINUTES} minutes et ne peut être utilisé qu'une seule fois.\n\nSi vous n'avez pas demandé ce lien, ignorez simplement cet email.`,
    html: buildMagicLinkHtml(magicLinkUrl),
  });

  if ("error" in result && result.error) {
    throw new Error(result.error.message || "Unable to send magic link email");
  }

  return result;
}
