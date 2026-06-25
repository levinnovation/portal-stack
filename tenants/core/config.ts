import type { TenantConfig } from "@/lib/tenant";
import { realestateCollections } from "./domain";

/**
 * Core Real Estate tenant.
 * 3 roles: admin, investor (inversionista), customer (comprador).
 * Vertical: realestate.
 * Brand: institutional navy + warm gold (Fraunces serif + Inter).
 */
export const coreTenant: TenantConfig = {
  id: "core",
  name: "Core Real Estate",
  domain: "portal.core.example",
  description: "Plataforma institucional de inversión inmobiliaria. Acceso transparente a portafolio, distribuciones, avance de obra y pagos.",
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
    excel: true,
    quickbase: true,
    documents: true,
    aiAgent: true,
    layoutBuilder: true,
    navFromDb: true,
    auditLog: true,
    impersonation: true,
  },
  ai: {
    enabled: true,
    provider: "openai",
    model: "gpt-4o-mini",
    systemPromptFile: "tenants/core/ai/prompts.ts",
    maxStepsPerTurn: 6,
    temperature: 0.3,
    backend: "local",
  },
  auth: {
    provider: "local",
    cookieName: "payload-token",
    sessionDays: 7,
  },
  roles: [
    {
      key: "admin",
      label: "Equipo Core",
      homePath: "/portal/admin",
      defaultLandingPageSlug: "admin-overview",
      nav: [
        { to: "/portal/admin", label: "Resumen", icon: "LayoutDashboard", end: true },
        { to: "/portal/admin/agents", label: "Agentes · Resumen", icon: "MessageCircle", kind: "custom" },
        { to: "/portal/admin/agents/leah", label: "Leah · Mercadeo", icon: "BarChart3", kind: "custom" },
        { to: "/portal/admin/agents/leah/contratos", label: "Leah · Contratos", icon: "FileSpreadsheet", kind: "custom" },
        { to: "/portal/admin/agents/qara", label: "Qara · Analítica", icon: "Users", kind: "custom" },
        { to: "/portal/admin/agents/qara/control", label: "Qara · Control", icon: "RefreshCw", kind: "custom" },
        { to: "/portal/admin/projects", label: "Proyectos", icon: "Building2" },
        { to: "/portal/admin/investors", label: "Inversionistas", icon: "Users" },
        { to: "/portal/admin/customers", label: "Clientes", icon: "ShoppingBag" },
        { to: "/portal/admin/excel", label: "Carga Excel", icon: "Upload" },
        { to: "/portal/admin/quickbase", label: "QuickBase", icon: "RefreshCw" },
        { to: "/portal/admin/reports", label: "Reportes", icon: "BarChart3" },
        { to: "/portal/admin/audit", label: "Auditoría", icon: "ShieldCheck" },
      ],
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
  integrations: [
    { source: "quickbase", enabled: true, secretRef: "quickbase" },
  ],
};
