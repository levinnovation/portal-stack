import type { CollectionConfig } from "payload";

/**
 * Datasets — named, reusable data sources that blocks consume.
 *
 * A dataset is a (key, query) pair where query is a structured JSON
 * describing how to fetch data from Payload or a derived aggregate.
 *
 * Datasets are tenant-aware: each dataset declares which vertical
 * (`realestate`, `fintech`, `generic`) it belongs to, and only loads
 * when the active tenant has that vertical enabled.
 *
 * Example keys (real estate):
 *   - count:projects
 *   - sum:investments.amountInvested
 *   - list:recent-payments
 *   - chart:investments-over-time
 */
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
    { name: "key", type: "text", required: true, unique: true, index: true, admin: { description: "Reference key used by blocks, e.g. 'count:projects'" } },
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
            { label: "Custom (advanced)", value: "custom" },
          ],
        },
        { name: "collection", type: "text", admin: { description: "Payload collection slug" } },
        { name: "field", type: "text", admin: { description: "Field to aggregate (for sum/avg)" } },
        { name: "where", type: "json", admin: { description: "Payload where clause" } },
        { name: "limit", type: "number", defaultValue: 10 },
        { name: "sort", type: "text" },
        { name: "handler", type: "text", admin: { description: "Custom handler for kind=custom (file path relative to src/lib/datasets/handlers/)" } },
      ],
    },
  ],
};
