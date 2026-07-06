/**
 * Edge-safe auth cookie name (middleware + provider).
 * ponytail: DB tenant overrides can't change cookie name at edge without AUTH_COOKIE_NAME env.
 */
import { coreTenant } from "@tenants/core/config";
import { finuTenant } from "@tenants/finu/config";
import { defaultTenant } from "@tenants/_default/config";

const BY_TENANT: Record<string, string> = {
  core: coreTenant.auth.cookieName,
  finu: finuTenant.auth.cookieName,
  _default: defaultTenant.auth.cookieName,
};

export function getAuthCookieName(): string {
  if (process.env.AUTH_COOKIE_NAME) return process.env.AUTH_COOKIE_NAME;
  const id = process.env.TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID || "core";
  return BY_TENANT[id] ?? defaultTenant.auth.cookieName;
}

export function parseAuthCookie(cookieHeader: string, cookieName = getAuthCookieName()): string | null {
  const escaped = cookieName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const m = cookieHeader.match(new RegExp(`${escaped}=([^;]+)`));
  return m?.[1] ?? null;
}
