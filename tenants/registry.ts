/**
 * Central tenant registry — scripts and payload.config import from here (no server-only).
 * `pnpm tenant:new` appends new tenants to this file automatically.
 */
import type { TenantConfig } from "@/lib/tenant-types";
import { defaultTenant } from "./_default/config";
import { coreTenant } from "./core/config";
import { finuTenant } from "./finu/config";

export const TENANT_REGISTRY: Record<string, TenantConfig> = {
  core: coreTenant,
  finu: finuTenant,
  _default: defaultTenant,
};
