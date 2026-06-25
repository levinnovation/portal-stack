import type { TenantConfig, TenantFeatureFlags, TenantNavItem, TenantRole, TenantTheme } from "./tenant-types";

/** Serializable tenant slice for the client PortalShell (no Payload CollectionConfig). */
export interface PortalShellTenant {
  theme: Pick<TenantTheme, "brand">;
  features: Pick<TenantFeatureFlags, "excel" | "quickbase">;
  roles: Array<Pick<TenantRole, "key" | "label" | "homePath"> & { nav: TenantNavItem[] }>;
}

export function toPortalShellTenant(tenant: TenantConfig): PortalShellTenant {
  return {
    theme: { brand: tenant.theme.brand },
    features: { excel: tenant.features.excel, quickbase: tenant.features.quickbase },
    roles: tenant.roles.map(({ key, label, homePath, nav }) => ({ key, label, homePath, nav })),
  };
}
