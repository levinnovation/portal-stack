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
      background: "0 0% 7%",
      foreground: "0 0% 95%",
      primary: "0 0% 11%",
      primaryForeground: "0 0% 97%",
      primaryGlow: "0 0% 25%",
      accent: "66 95% 52%",
      accentForeground: "0 0% 8%",
      accentSoft: "0 0% 16%",
      success: "147 50% 48%",
      warning: "35 95% 56%",
      destructive: "0 80% 60%",
      border: "0 0% 18%",
      ring: "66 95% 52%",
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
      // Internal team accounts (Users.role = "admin") were locked out of
      // /portal entirely: PortalRoot/AdminHome bounce any session whose role
      // has no entry here back to /portal/auth. The customer-facing portal
      // still exists for admins as a thin ops view (/portal/admin pages
      // rendered from the Pages layout builder); the full internal suite
      // stays on Agentyx Platform.
      key: "admin",
      label: "Equipo Core",
      homePath: "/portal/admin",
      defaultLandingPageSlug: "admin-overview",
      nav: [{ to: "/portal/admin", label: "Resumen", icon: "LayoutDashboard", end: true }],
    },
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
