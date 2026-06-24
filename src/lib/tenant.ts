/**
 * Tenant configuration system.
 *
 * Each deployment of portal-stack is bound to a single tenant via the
 * TENANT_ID env var (or NEXT_PUBLIC_TENANT_ID for the browser).
 *
 * Tenant config can come from:
 *  1. Hard-coded TS files under /tenants/<id>/config.ts (preferred for build-time)
 *  2. The `tenants` collection in Payload (DB-driven, overrides file config)
 *
 * This file exposes:
 *  - TenantConfig: the typed configuration shape
 *  - getTenantId(): which tenant is this deploy?
 *  - getTenant(): full resolved config (cached)
 *  - getTenantTheme(): convenience for theme tokens
 *  - getTenantFeatures(): convenience for feature flags
 *  - isVerticalEnabled(): vertical guard
 */

import "server-only";
import { cache } from "react";
import { defaultTenant } from "../../tenants/_default/config";
import { coreTenant } from "../../tenants/core/config";
import { finuTenant } from "../../tenants/finu/config";
import type { CollectionConfig } from "payload";

export type Vertical = "realestate" | "fintech" | "generic";

export type AuthProviderKind = "local" | "agentyx";

export interface TenantTheme {
  brand: string;
  logo?: string;
  colors: {
    background: string;     // HSL "30 20% 97%"
    foreground: string;
    primary: string;         // navy
    primaryForeground: string;
    primaryGlow: string;
    accent: string;          // gold
    accentForeground: string;
    accentSoft: string;
    success: string;
    warning: string;
    destructive: string;
    border: string;
    ring: string;
  };
  fonts: {
    display: string;
    sans: string;
  };
  radius: string;
}

export interface TenantFeatureFlags {
  chat: boolean;
  excel: boolean;
  quickbase: boolean;
  documents: boolean;
  aiAgent: boolean;
  layoutBuilder: boolean;
  auditLog: boolean;
  impersonation: boolean;
}

export interface TenantAIConfig {
  enabled: boolean;
  provider: "openai" | "anthropic" | "vercel-gateway";
  model: string;
  systemPromptFile: string;     // relative to tenants/<id>/ai/
  maxStepsPerTurn: number;
  temperature: number;
}

export interface TenantAuthConfig {
  provider: AuthProviderKind;
  agentyxJwksUrl?: string;
  agentyxAudience?: string;
  cookieName: string;
  sessionDays: number;
}

export interface TenantNavItem {
  to: string;
  label: string;
  icon: string;             // lucide-react icon name
  end?: boolean;
  roles?: string[];         // restrict to roles
}

export interface TenantRole {
  key: string;              // "admin" | "investor" | ...
  label: string;
  homePath: string;
  defaultLandingPageSlug?: string;   // renders via layout builder
  nav: TenantNavItem[];
}

export interface TenantConfig {
  id: string;
  name: string;
  domain?: string;
  description?: string;
  verticals: Vertical[];
  theme: TenantTheme;
  features: TenantFeatureFlags;
  ai: TenantAIConfig;
  auth: TenantAuthConfig;
  roles: TenantRole[];
  payloadCollections?: CollectionConfig[];   // domain collections added by this tenant
}

const TENANT_REGISTRY: Record<string, TenantConfig> = {
  core: coreTenant,
  finu: finuTenant,
  _default: defaultTenant,
};

export function getTenantId(): string {
  return process.env.TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID || "core";
}

/** Sync resolver for payload.config.ts at boot — reads registry payloadCollections. */
export function getTenantCollectionsSync(tenantId = getTenantId()): CollectionConfig[] {
  const config = TENANT_REGISTRY[tenantId] ?? TENANT_REGISTRY._default;
  return config.payloadCollections ?? [];
}

export const getTenant = cache(async (): Promise<TenantConfig> => {
  const id = getTenantId();
  const fromRegistry = TENANT_REGISTRY[id] ?? TENANT_REGISTRY._default;

  // Optional DB override (loaded lazily; returns registry copy if DB is unreachable
  // or no row is present). This lets ops change config without redeploying.
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
      const db = result.docs[0] as any;
      return mergeTenant(fromRegistry, db);
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
    theme: { ...base.theme, ...(override.theme || {}), colors: { ...base.theme.colors, ...(override.theme?.colors || {}) } },
    features: { ...base.features, ...(override.features || {}) },
    ai: { ...base.ai, ...(override.ai || {}) },
    auth: { ...base.auth, ...(override.auth || {}) },
  };
}

export function listRegisteredTenants(): string[] {
  return Object.keys(TENANT_REGISTRY).filter((k) => k !== "_default");
}
