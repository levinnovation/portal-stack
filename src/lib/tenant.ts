/**
 * Tenant configuration system (server runtime).
 *
 * Sync registry + types: ./tenant-registry.ts, ./tenant-types.ts, tenants/registry.ts
 */
import "server-only";
import { cache } from "react";
import type {
  TenantConfig,
  TenantFeatureFlags,
  TenantRole,
  TenantTheme,
  Vertical,
} from "./tenant-types";
import {
  getTenantCollectionsSync,
  getTenantConfigSync,
  getTenantId,
  listRegisteredTenants,
  TENANT_REGISTRY,
} from "./tenant-registry";

export type {
  AuthProviderKind,
  TenantAIConfig,
  TenantAuthConfig,
  TenantConfig,
  TenantExternalAgentConfig,
  TenantExternalDatabaseConfig,
  TenantFeatureFlags,
  TenantIntegrationConfig,
  TenantNavItem,
  TenantNavKind,
  TenantRole,
  TenantTheme,
  Vertical,
} from "./tenant-types";

export {
  getTenantCollectionsSync,
  getTenantConfigSync,
  getTenantId,
  listRegisteredTenants,
  TENANT_REGISTRY,
};

export const getTenant = cache(async (): Promise<TenantConfig> => {
  const id = getTenantId();
  const fromRegistry = getTenantConfigSync(id);

  try {
    const { getPayloadClient } = await import("./payload");
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "tenants",
      where: { id: { equals: id } },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    if (result.docs[0]) {
      return mergeTenant(fromRegistry, result.docs[0] as any);
    }
  } catch {
    // DB not ready or no override — fall through
  }
  return fromRegistry;
});

export async function getTenantTheme(): Promise<TenantTheme> {
  return (await getTenant()).theme;
}

export async function getTenantFeatures(): Promise<TenantFeatureFlags> {
  return (await getTenant()).features;
}

export async function isVerticalEnabled(vertical: Vertical): Promise<boolean> {
  const t = await getTenant();
  return t.verticals.includes(vertical);
}

export async function getRolesForUser(userRole: string): Promise<TenantRole[]> {
  const t = await getTenant();
  return t.roles.filter((r) => r.key === userRole);
}

export async function getHomePathForRole(role: string): Promise<string> {
  const t = await getTenant();
  const r = t.roles.find((x) => x.key === role);
  return r?.homePath || "/";
}

function mergeTenant(base: TenantConfig, override: any): TenantConfig {
  return {
    ...base,
    ...override,
    theme: {
      ...base.theme,
      ...(override.theme || {}),
      colors: { ...base.theme.colors, ...(override.theme?.colors || {}) },
      colorsDark: { ...(base.theme.colorsDark || {}), ...(override.theme?.colorsDark || {}) },
    },
    features: { ...base.features, ...(override.features || {}) },
    ai: { ...base.ai, ...(override.ai || {}) },
    auth: { ...base.auth, ...(override.auth || {}) },
    integrations: override.integrations ?? base.integrations,
    externalAgents: override.externalAgents ?? base.externalAgents,
    externalDatabases: override.externalDatabases ?? base.externalDatabases,
  };
}

export { resolveAIBackend } from "./ai/backend";
