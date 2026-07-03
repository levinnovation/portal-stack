import type { TenantConfig } from "@/lib/tenant";
import { realestateCollections } from "./domain";

/**
 * Core client portal — customer-facing only (investor + customer).
 * Deploy separately from Agentyx Platform (agentyx-generic-portal).
 * Branch: client-core · see docs/CLIENT-CORE-DEPLOY.md
 */
export const coreTenant: TenantConfig = {
  id: "core",
  name: "Core Real Estate — Client Portal",
  domain: "portal.core.example",
  description:
    "Portal customer-facing para inversionistas y compradores. El equipo interno usa Agentyx Platform (deploy separado).",
  verticals: ["realestate"],
  theme: {
    brand: "CORE",
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
    auditLog: false,
    impersonation: false,
  },
  ai: {
    enabled: true,
    provider: "openai",
    model: "gpt-4o-mini",
    systemPromptFile: "tenants/core/ai/prompts.ts",
    maxStepsPerTurn: 6,
    temperature: 0.3,
  },
  auth: {
    provider: "local",
    cookieName: "payload-token",
    sessionDays: 7,
  },
  roles: [
    {
      key: "investor",
      label: "Inversionistas",
      homePath: "/portal/investor",
      defaultLandingPageSlug: "investor-portfolio",
      nav: [
        { to: "/portal/investor", label: "Portafolio", icon: "LayoutDashboard", end: true },
        { to: "/portal/investor/projects", label: "Mis proyectos", icon: "Building2" },
        { to: "/portal/investor/distributions", label: "Distribuciones", icon: "TrendingUp" },
        { to: "/portal/investor/documents", label: "Documentos", icon: "FileText" },
      ],
    },
    {
      key: "customer",
      label: "Clientes",
      homePath: "/portal/customer",
      defaultLandingPageSlug: "customer-overview",
      nav: [
        { to: "/portal/customer", label: "Resumen", icon: "LayoutDashboard", end: true },
        { to: "/portal/customer/unit", label: "Mi unidad", icon: "Building2" },
        { to: "/portal/customer/progress", label: "Avance de obra", icon: "Hammer" },
        { to: "/portal/customer/payments", label: "Plan de pagos", icon: "CreditCard" },
        { to: "/portal/customer/documents", label: "Documentos", icon: "FileText" },
      ],
    },
  ],
  payloadCollections: realestateCollections,
};
