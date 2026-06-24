import type { CollectionConfig } from "payload";
import { BLOCK_FIELDS } from "./_blocks";

/**
 * Pages — the layout builder primitive.
 * Each Page has a slug, optional role restrictions, and an array of blocks.
 * The frontend catch-all route (app/(frontend)/(portal)/[...slug]/page.tsx)
 * reads a Page by slug and renders its blocks via the BlockRenderer.
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: { useAsTitle: "title", group: "Content" },
  access: {
    read: () => true, // public read; access control is per-block + per-page role restriction at render time
    create: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    update: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "URL path under /portal/<role>/. E.g. 'overview', 'projects/123'. Use leading '/'." },
    },
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
        { label: "Superadmin", value: "superadmin" },
      ],
      admin: { description: "Which roles can view this page" },
    },
    {
      name: "layout",
      type: "array",
      labels: { singular: "Block", plural: "Blocks" },
      fields: BLOCK_FIELDS,
      admin: { description: "Compose the page from blocks top-to-bottom" },
    },
  ],
};
