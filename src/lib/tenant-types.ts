import type { CollectionConfig } from "payload";
import type { AIBackend } from "./ai/backend";

export type { AIBackend } from "./ai/backend";

export type Vertical = "realestate" | "fintech" | "generic";
export type AuthProviderKind = "local" | "agentyx";
export type TenantNavKind = "page" | "custom" | "group";

export interface TenantTheme {
  brand: string;
  logo?: string;
  colors: {
    background: string;
    foreground: string;
    primary: string;
    primaryForeground: string;
    primaryGlow: string;
    accent: string;
    accentForeground: string;
    accentSoft: string;
    success: string;
    warning: string;
    destructive: string;
    border: string;
    ring: string;
  };
  fonts: { display: string; sans: string };
  radius: string;
}

export interface TenantFeatureFlags {
  chat: boolean;
  excel: boolean;
  quickbase: boolean;
  documents: boolean;
  aiAgent: boolean;
  layoutBuilder: boolean;
  navFromDb?: boolean;
  auditLog: boolean;
  impersonation: boolean;
}

export interface TenantAIConfig {
  enabled: boolean;
  provider: "openai" | "anthropic" | "vercel-gateway";
  model: string;
  systemPromptFile: string;
  maxStepsPerTurn: number;
  temperature: number;
  backend?: AIBackend;
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
  icon: string;
  end?: boolean;
  roles?: string[];
  /** "page" = CMS layout builder (default). "custom" = dedicated Next route. */
  kind?: TenantNavKind;
}

export interface TenantRole {
  key: string;
  label: string;
  homePath: string;
  defaultLandingPageSlug?: string;
  nav: TenantNavItem[];
}

export interface TenantIntegrationConfig {
  source: string;
  enabled?: boolean;
  baseUrl?: string;
  secretRef?: string;
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
  payloadCollections?: CollectionConfig[];
  integrations?: TenantIntegrationConfig[];
}
