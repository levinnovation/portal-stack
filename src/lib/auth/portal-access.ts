/**
 * Portal route prefix → roles allowed to enter that section.
 * ponytail: static map; add a prefix here when a tenant ships a new portal role.
 */
export const PORTAL_PREFIX_ROLES: Record<string, readonly string[]> = {
  "/portal/admin": ["admin", "superadmin"],
  "/portal/investor": ["investor", "admin", "superadmin"],
  "/portal/customer": ["customer", "admin", "superadmin"],
};

export function portalPrefixForPath(pathname: string): string | null {
  for (const prefix of Object.keys(PORTAL_PREFIX_ROLES)) {
    if (pathname === prefix || pathname.startsWith(`${prefix}/`)) return prefix;
  }
  return null;
}

export function canAccessPortalPrefix(prefix: string, role: string): boolean {
  return PORTAL_PREFIX_ROLES[prefix]?.includes(role) ?? false;
}
