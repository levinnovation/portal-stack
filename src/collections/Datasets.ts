import type { CollectionConfig } from "payload";

/** Named, reusable data sources for layout blocks and AI tools. */
export const Datasets: CollectionConfig = {
  slug: "datasets",
  admin: { useAsTitle: "name", group: "Content" },
  access: {
    read: ({ req }) => !!req.user,
    create: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    update: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  fields: [
    { name: "name", type: "text", required: true },
    { name: "key", type: "text", required: true, unique: true, index: true },
    { name: "description", type: "textarea" },
    {
      name: "vertical",
      type: "select",
      required: true,
      defaultValue: "generic",
      options: [
        { label: "Genérico", value: "generic" },
        { label: "Real Estate", value: "realestate" },
        { label: "Fintech", value: "fintech" },
      ],
    },
    {
      name: "query",
      type: "group",
      label: "Query",
      fields: [
        {
          name: "kind",
          type: "select",
          required: true,
          defaultValue: "count",
          options: [
            { label: "Count", value: "count" },
            { label: "Sum", value: "sum" },
            { label: "Average", value: "avg" },
            { label: "List", value: "list" },
            { label: "Group by month", value: "monthly" },
            { label: "Custom handler", value: "custom" },
            { label: "HTTP / REST", value: "http" },
          ],
        },
        { name: "collection", type: "text" },
        { name: "field", type: "text" },
        { name: "where", type: "json" },
        { name: "limit", type: "number", defaultValue: 10 },
        { name: "sort", type: "text" },
        { name: "handler", type: "text", admin: { description: "Registry key: payload-count, rest-json, …" } },
        { name: "url", type: "text", admin: { description: "HTTP kind: external URL" } },
        { name: "jsonPath", type: "text", admin: { description: "HTTP kind: dot path into JSON body" } },
        { name: "tokenSource", type: "text", admin: { description: "Credential source e.g. quickbase" } },
      ],
    },
  ],
};
