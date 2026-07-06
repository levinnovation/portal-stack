import type { CollectionConfig } from "payload";
import { LAYOUT_BLOCKS } from "./_blocks";
import { normalizeLayout } from "@/lib/blocks/normalize-layout";

/**
 * Pages — layout builder primitive. Frontend reads published versions via renderPage().
 */
export const Pages: CollectionConfig = {
  slug: "pages",
  admin: {
    useAsTitle: "title",
    group: "Content",
    livePreview: {
      url: ({ data }) => {
        const slug = data?.slug as string | undefined;
        if (!slug) return null;
        const base = process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000";
        return `${base}/portal/preview/${slug}?draft=1`;
      },
    },
  },
  versions: { drafts: { autosave: true }, maxPerDoc: 50 },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    update: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    readVersions: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  hooks: {
    beforeChange: [
      ({ data }) => {
        if (data?.layout) data.layout = normalizeLayout(data.layout as unknown[]);
        return data;
      },
    ],
  },
  fields: [
    { name: "title", type: "text", required: true },
    {
      name: "slug",
      type: "text",
      required: true,
      unique: true,
      index: true,
      admin: { description: "Stored slug e.g. admin-projects. URL /portal/admin/projects resolves via prefix." },
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
    },
    {
      name: "showInNav",
      type: "checkbox",
      defaultValue: false,
      admin: { description: "Show in sidebar when features.navFromDb is enabled" },
    },
    { name: "navLabel", type: "text" },
    { name: "navIcon", type: "text", admin: { description: "Lucide icon name" } },
    { name: "navOrder", type: "number", defaultValue: 0 },
    {
      name: "navPath",
      type: "text",
      admin: { description: "Portal path e.g. /portal/admin/projects (optional; derived from slug if empty)" },
    },
    {
      name: "layout",
      type: "blocks",
      blocks: LAYOUT_BLOCKS,
      admin: { description: "Compose the page from blocks top-to-bottom" },
    },
  ],
};

/** Seed shape for tenants/<id>/pages.ts consumed by pnpm seed */
export type SeedPage = {
  title: string;
  slug: string;
  description?: string;
  allowedRoles?: string[];
  showInNav?: boolean;
  navLabel?: string;
  navIcon?: string;
  navOrder?: number;
  navPath?: string;
  layout?: unknown[];
};
