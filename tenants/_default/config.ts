import type { TenantConfig } from "@/lib/tenant";

/**
 * Default tenant — used when TENANT_ID is unset or unknown.
 * Plain institutional navy + gold, generic dashboard, no vertical-specific collections.
 */
export const defaultTenant: TenantConfig = {
  id: "_default",
  name: "Portal Stack",
  description: "Generic portal scaffold. Set TENANT_ID to a registered tenant or create one under /tenants/<id>/config.ts.",
  verticals: ["generic"],
  theme: {
    brand: "Portal",
    colors: {
      background: "30 20% 97%",
      foreground: "220 40% 12%",
      primary: "220 50% 14%",
      primaryForeground: "38 50% 92%",
      primaryGlow: "220 45% 24%",
      accent: "38 65% 52%",
      accentForeground: "220 50% 14%",
      accentSoft: "38 60% 88%",
      success: "152 50% 38%",
      warning: "35 85% 50%",
      destructive: "0 70% 48%",
      border: "220 18% 88%",
      ring: "38 65% 52%",
    },
    fonts: {
      display: "Fraunces, Georgia, serif",
      sans: "Inter, system-ui, sans-serif",
    },
    radius: "0.625rem",
  },
  features: {
    chat: true,
    excel: false,
    quickbase: false,
    documents: true,
    aiAgent: true,
    layoutBuilder: true,
    auditLog: true,
    impersonation: false,
  },
  ai: {
    enabled: true,
    provider: "openai",
    model: "gpt-4o-mini",
    systemPromptFile: "tenants/_default/ai/prompts.ts",
    maxStepsPerTurn: 5,
    temperature: 0.3,
  },
  auth: {
    provider: "local",
    cookieName: "payload-token",
    sessionDays: 7,
  },
  roles: [
    {
      key: "admin",
      label: "Administrador",
      homePath: "/portal/admin",
      nav: [],
    },
    {
      key: "member",
      label: "Miembro",
      homePath: "/portal",
      nav: [],
    },
  ],
};
