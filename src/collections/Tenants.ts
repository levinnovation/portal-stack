import type { CollectionConfig } from "payload";

/**
 * Tenants — DB-driven tenant config that overrides the TS files under /tenants/<id>/.
 * Use this to change theme/feature flags/branding without redeploying.
 * Tenants loaded from this collection are merged on top of the TS registry
 * (see src/lib/tenant.ts → getTenant).
 */
export const Tenants: CollectionConfig = {
  slug: "tenants",
  admin: { useAsTitle: "id", group: "Platform" },
  access: {
    read: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    create: ({ req }) => req.user?.role === "superadmin",
    update: ({ req }) => req.user?.role === "superadmin",
    delete: ({ req }) => req.user?.role === "superadmin",
  },
  fields: [
    { name: "id", type: "text", required: true, unique: true, admin: { description: "Matches TENANT_ID env var" } },
    { name: "name", type: "text", required: true },
    { name: "domain", type: "text" },
    { name: "description", type: "textarea" },
    {
      name: "verticals",
      type: "select",
      hasMany: true,
      required: true,
      defaultValue: ["generic"],
      options: [
        { label: "Real Estate", value: "realestate" },
        { label: "Fintech", value: "fintech" },
        { label: "Genérico", value: "generic" },
      ],
    },
    {
      name: "theme",
      type: "group",
      fields: [
        { name: "brand", type: "text" },
        { name: "logo", type: "text" },
        {
          name: "colors",
          type: "group",
          fields: [
            { name: "background", type: "text" },
            { name: "foreground", type: "text" },
            { name: "primary", type: "text" },
            { name: "primaryForeground", type: "text" },
            { name: "primaryGlow", type: "text" },
            { name: "accent", type: "text" },
            { name: "accentForeground", type: "text" },
            { name: "accentSoft", type: "text" },
            { name: "success", type: "text" },
            { name: "warning", type: "text" },
            { name: "destructive", type: "text" },
            { name: "border", type: "text" },
            { name: "ring", type: "text" },
          ],
        },
      ],
    },
    {
      name: "features",
      type: "group",
      fields: [
        { name: "chat", type: "checkbox", defaultValue: true },
        { name: "excel", type: "checkbox", defaultValue: false },
        { name: "quickbase", type: "checkbox", defaultValue: false },
        { name: "documents", type: "checkbox", defaultValue: true },
        { name: "aiAgent", type: "checkbox", defaultValue: true },
        { name: "layoutBuilder", type: "checkbox", defaultValue: true },
        { name: "auditLog", type: "checkbox", defaultValue: true },
        { name: "impersonation", type: "checkbox", defaultValue: false },
      ],
    },
    {
      name: "ai",
      type: "group",
      fields: [
        { name: "enabled", type: "checkbox", defaultValue: true },
        {
          name: "provider",
          type: "select",
          defaultValue: "openai",
          options: [
            { label: "OpenAI", value: "openai" },
            { label: "Anthropic", value: "anthropic" },
            { label: "Vercel AI Gateway", value: "vercel-gateway" },
          ],
        },
        { name: "model", type: "text", defaultValue: "gpt-4o-mini" },
        { name: "maxStepsPerTurn", type: "number", defaultValue: 5 },
        { name: "temperature", type: "number", defaultValue: 0.3 },
      ],
    },
    {
      name: "auth",
      type: "group",
      fields: [
        {
          name: "provider",
          type: "select",
          defaultValue: "local",
          options: [
            { label: "Local (Payload)", value: "local" },
            { label: "Agentyx (JWT)", value: "agentyx" },
          ],
        },
        { name: "agentyxJwksUrl", type: "text" },
        { name: "agentyxAudience", type: "text" },
        { name: "cookieName", type: "text", defaultValue: "payload-token" },
        { name: "sessionDays", type: "number", defaultValue: 7 },
      ],
    },
  ],
};
