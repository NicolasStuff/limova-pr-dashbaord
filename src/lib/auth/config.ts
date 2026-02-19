export const SESSION_COOKIE_NAME = "limova_session";
export const SESSION_MAX_AGE = 30 * 24 * 60 * 60; // 30 days in seconds

export const AUTH_ALLOWED_EMAIL_DOMAIN = (process.env.AUTH_ALLOWED_EMAIL_DOMAIN ?? "limova.ai")
  .trim()
  .toLowerCase();

const parsedTtl = Number(process.env.MAGIC_LINK_TTL_MINUTES ?? "15");
export const MAGIC_LINK_TTL_MINUTES =
  Number.isFinite(parsedTtl) && parsedTtl > 0 ? parsedTtl : 15;
