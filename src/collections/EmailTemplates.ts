import type { CollectionConfig } from "payload";

const adminOnly = ({ req }: { req: { user?: { role?: string } | null } }) =>
  req.user?.role === "admin" || req.user?.role === "superadmin";

/**
 * Maizzle-native email template catalog.
 *
 * A template may contain a rendered HTML snapshot while the renderer service is
 * being introduced, or a renderer reference for the future service. Bindings
 * decide which active template a tenant or external agent may use.
 */
export const EmailTemplates: CollectionConfig = {
  slug: "email-templates",
  admin: { useAsTitle: "name", group: "Platform", defaultColumns: ["name", "slug", "tenantId", "active", "updatedAt"] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: ({ req }) => req.user?.role === "superadmin" },
  fields: [
    { name: "tenantId", type: "text", required: true, index: true, admin: { description: "Workspace / tenant scope (for example: core)" } },
    { name: "slug", type: "text", required: true, index: true, admin: { description: "Stable Maizzle template slug, e.g. payment-due" } },
    { name: "name", type: "text", required: true },
    { name: "description", type: "textarea" },
    { name: "slotsSchema", type: "json", admin: { description: "JSON Schema-like contract for the slots accepted by this template." } },
    {
      name: "brand",
      type: "group",
      fields: [
        { name: "name", type: "text" },
        { name: "themeRef", type: "text", admin: { description: "Optional tenant theme or Maizzle brand token reference." } },
        { name: "variables", type: "json", admin: { description: "Optional brand variables provided to the renderer." } },
      ],
    },
    { name: "active", type: "checkbox", defaultValue: true, index: true },
    {
      name: "preview",
      type: "group",
      fields: [
        { name: "url", type: "text", admin: { description: "HTTPS preview URL, if hosted externally." } },
        { name: "html", type: "textarea", admin: { description: "Static preview HTML. Stored separately from the render payload." } },
      ],
    },
    {
      name: "render",
      type: "group",
      fields: [
        { name: "html", type: "textarea", admin: { description: "Rendered HTML snapshot. Slot tokens use {{slot_name}}." } },
        { name: "rendererUrl", type: "text", admin: { description: "Future Maizzle renderer endpoint URL." } },
        { name: "rendererRef", type: "text", admin: { description: "Future renderer template/version reference." } },
      ],
    },
    {
      name: "source",
      type: "group",
      fields: [
        { name: "provider", type: "text", defaultValue: "maizzle" },
        { name: "version", type: "text" },
        { name: "sourceRef", type: "text", admin: { description: "Git path, artifact ID, or source repository reference." } },
      ],
    },
  ],
};

export const EmailTemplateBindings: CollectionConfig = {
  slug: "email-template-bindings",
  admin: { useAsTitle: "useCase", group: "Platform", defaultColumns: ["tenantId", "agentSlug", "useCase", "template", "active"] },
  access: { read: adminOnly, create: adminOnly, update: adminOnly, delete: ({ req }) => req.user?.role === "superadmin" },
  fields: [
    { name: "tenantId", type: "text", required: true, index: true, admin: { description: "Workspace / tenant scope." } },
    { name: "agentSlug", type: "text", index: true, admin: { description: "Optional external-agent ID. Empty means workspace default." } },
    { name: "useCase", type: "text", required: true, defaultValue: "shell", index: true, admin: { description: "Use shell for the default wrapper; use a named event for an override." } },
    { name: "template", type: "relationship", relationTo: "email-templates", required: true, index: true },
    { name: "active", type: "checkbox", defaultValue: true, index: true },
  ],
};
