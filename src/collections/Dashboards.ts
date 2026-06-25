import type { CollectionConfig } from "payload";

/**
 * Dashboards — optional grouping of Pages for admin organization.
 * ponytail: sidebar nav is driven by Pages.showInNav when features.navFromDb is on.
 */
export const Dashboards: CollectionConfig = {
  slug: "dashboards",
  admin: {
    useAsTitle: "title",
    group: "Content",
    description: "Group pages for admin UX. Portal sidebar uses Pages.showInNav, not this collection.",
  },
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
      defaultValue: ["admin"],
      options: [
        { label: "Admin", value: "admin" },
        { label: "Inversionista", value: "investor" },
        { label: "Cliente", value: "customer" },
        { label: "Member", value: "member" },
      ],
    },
    { name: "pages", type: "relationship", relationTo: "pages", hasMany: true },
  ],
};
