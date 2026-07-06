import type { TenantConfig, TenantRole } from "@/lib/tenant-types";

/** Map Payload user.role → tenant portal role config (superadmin uses admin nav/home). */
export function resolveTenantRole(tenant: TenantConfig, userRole: string): TenantRole | undefined {
  const direct = tenant.roles.find((r) => r.key === userRole);
  if (direct) return direct;
  if (userRole === "superadmin") return tenant.roles.find((r) => r.key === "admin");
  return undefined;
}
