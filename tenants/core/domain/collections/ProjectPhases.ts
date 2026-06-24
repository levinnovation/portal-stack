import type { CollectionConfig } from "payload";

export const ProjectPhases: CollectionConfig = {
  slug: "project-phases",
  admin: { useAsTitle: "phaseName" },
  versions: { maxPerDoc: 20 },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
    readVersions: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "project",
      type: "relationship",
      relationTo: "projects",
      required: true,
    },
    { name: "phaseName", type: "text", required: true },
    { name: "orderIndex", type: "number", defaultValue: 0, required: true },
    { name: "completionPercentage", type: "number", defaultValue: 0, required: true, min: 0, max: 100 },
    { name: "estimatedStart", type: "date" },
    { name: "actualStart", type: "date" },
    { name: "estimatedEnd", type: "date" },
    { name: "actualEnd", type: "date" },
    {
      name: "photos",
      type: "array",
      fields: [
        { name: "image", type: "upload", relationTo: "media", required: true },
        { name: "caption", type: "text" },
      ],
    },
  ],
};
