import type { CollectionConfig } from "payload";
import { TENANT_REGISTRY } from "../../tenants/registry";
import type { TenantConfig } from "./tenant-types";

export { TENANT_REGISTRY };

export function getTenantId(): string {
  return process.env.TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID || "core";
}

export function getTenantConfigSync(id = getTenantId()): TenantConfig {
  return TENANT_REGISTRY[id] ?? TENANT_REGISTRY._default;
}

export function getTenantCollectionsSync(tenantId = getTenantId()): CollectionConfig[] {
  return getTenantConfigSync(tenantId).payloadCollections ?? [];
}

export function listRegisteredTenants(): string[] {
  return Object.keys(TENANT_REGISTRY).filter((k) => k !== "_default");
}
