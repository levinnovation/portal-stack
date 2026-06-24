import type { TenantConfig } from "@/lib/tenant";

/**
 * Finu — fintech / lending vertical.
 * Different palette (teal + gold), different roles, fintech-themed AI persona.
 */
export const finuTenant: TenantConfig = {
  id: "finu",
  name: "Finu",
  domain: "portal.finu.example",
  description: "Plataforma de crédito digital. Solicita, sigue y paga tus préstamos en un solo lugar.",
  verticals: ["fintech", "generic"],
  theme: {
    brand: "FINU",
    colors: {
      background: "210 20% 98%",
      foreground: "210 30% 12%",
      primary: "210 70% 28%",
      primaryForeground: "210 30% 95%",
      primaryGlow: "210 70% 38%",
      accent: "38 80% 55%",
      accentForeground: "210 30% 12%",
      accentSoft: "38 80% 90%",
      success: "150 60% 38%",
      warning: "30 90% 50%",
      destructive: "0 75% 50%",
      border: "210 18% 88%",
      ring: "210 70% 28%",
    },
    fonts: {
      display: "Inter, system-ui, sans-serif",
      sans: "Inter, system-ui, sans-serif",
    },
    radius: "0.5rem",
  },
  features: {
    chat: true,
    excel: true,
    quickbase: false,
    documents: true,
    aiAgent: true,
    layoutBuilder: true,
    auditLog: true,
    impersonation: true,
  },
  ai: {
    enabled: true,
    provider: "openai",
    model: "gpt-4o-mini",
    systemPromptFile: "tenants/finu/ai/prompts.ts",
    maxStepsPerTurn: 5,
    temperature: 0.2,
  },
  auth: {
    provider: "local",
    cookieName: "payload-token",
    sessionDays: 7,
  },
  roles: [
    {
      key: "admin",
      label: "Equipo Finu",
      homePath: "/portal/admin",
      defaultLandingPageSlug: "finu-admin-overview",
      nav: [
        { to: "/portal/admin", label: "Resumen", icon: "LayoutDashboard", end: true },
        { to: "/portal/admin/loans", label: "Préstamos", icon: "Briefcase" },
        { to: "/portal/admin/applicants", label: "Solicitantes", icon: "Users" },
        { to: "/portal/admin/portfolio", label: "Cartera", icon: "TrendingUp" },
        { to: "/portal/admin/reports", label: "Reportes", icon: "BarChart3" },
      ],
    },
    {
      key: "customer",
      label: "Clientes",
      homePath: "/portal/customer",
      defaultLandingPageSlug: "finu-customer-overview",
      nav: [
        { to: "/portal/customer", label: "Mi préstamo", icon: "LayoutDashboard", end: true },
        { to: "/portal/customer/schedule", label: "Calendario", icon: "Calendar" },
        { to: "/portal/customer/payments", label: "Pagos", icon: "CreditCard" },
        { to: "/portal/customer/documents", label: "Documentos", icon: "FileText" },
      ],
    },
  ],
  payloadCollections: [],
};
