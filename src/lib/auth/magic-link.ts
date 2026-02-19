import { createHash, randomBytes } from "node:crypto";
import { AUTH_ALLOWED_EMAIL_DOMAIN, MAGIC_LINK_TTL_MINUTES } from "./config";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export function isValidEmailFormat(email: string): boolean {
  return EMAIL_REGEX.test(email);
}

export function hasAllowedEmailDomain(
  email: string,
  allowedDomain: string = AUTH_ALLOWED_EMAIL_DOMAIN
): boolean {
  const atIndex = email.lastIndexOf("@");
  if (atIndex <= 0) {
    return false;
  }

  const domain = email.slice(atIndex + 1).toLowerCase();
  return domain === allowedDomain.trim().toLowerCase();
}

export function createMagicLinkToken(): string {
  return randomBytes(32).toString("base64url");
}

export function hashMagicLinkToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

export function getMagicLinkExpiryDate() {
  return new Date(Date.now() + MAGIC_LINK_TTL_MINUTES * 60 * 1000);
}
