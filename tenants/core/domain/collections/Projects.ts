import type { CollectionConfig } from "payload";

export const Projects: CollectionConfig = {
  slug: "projects",
  admin: { useAsTitle: "name" },
  versions: { drafts: { autosave: true }, maxPerDoc: 50 },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
    readVersions: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "location", type: "text" },
    {
      name: "type",
      type: "select",
      defaultValue: "residential",
      options: [
        { label: "Residencial", value: "residential" },
        { label: "Comercial", value: "commercial" },
        { label: "Mixto", value: "mixed" },
      ],
    },
    { name: "totalUnits", type: "number", defaultValue: 0 },
    { name: "totalSqft", type: "number" },
    { name: "budgetTotal", type: "number" },
    {
      name: "status",
      type: "select",
      defaultValue: "planning",
      required: true,
      options: [
        { label: "Planeación", value: "planning" },
        { label: "Pre-construcción", value: "pre_construction" },
        { label: "Construcción", value: "construction" },
        { label: "Entregado", value: "completed" },
      ],
    },
    { name: "startDate", type: "date" },
    { name: "estimatedDelivery", type: "date" },
    { name: "coverImage", type: "upload", relationTo: "media" },
    { name: "description", type: "textarea" },
    { name: "quickbaseRecordId", type: "text", admin: { description: "ID de QuickBase para sincronización" } },
  ],
};
