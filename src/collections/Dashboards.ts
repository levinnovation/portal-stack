import type { CollectionConfig } from "payload";

/**
 * Dashboards — named groupings of Pages, shown in the sidebar.
 * Each dashboard is a landing container; users land on their role's
 * default dashboard after login.
 */
export const Dashboards: CollectionConfig = {
  slug: "dashboards",
  admin: { useAsTitle: "title", group: "Content" },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    update: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  fields: [
    { name: "title", type: "text", required: true },
    { name: "slug", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea" },
    {
      name: "allowedRoles",
      type: "select",
      hasMany: true,
      defaultValue: ["admin", "investor", "customer", "member"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Inversionista", value: "investor" },
        { label: "Cliente", value: "customer" },
        { label: "Member (genérico)", value: "member" },
      ],
    },
    {
      name: "pages",
      type: "relationship",
      relationTo: "pages",
      hasMany: true,
    },
  ],
};
