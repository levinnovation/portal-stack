import type { CollectionConfig } from "payload";

export const AuditLogs: CollectionConfig = {
  slug: "audit-logs",
  admin: { useAsTitle: "action" },
  access: {
    read: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    create: ({ req }) => !!req.user,
    update: () => false,
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  fields: [
    { name: "actor", type: "relationship", relationTo: "users" },
    { name: "action", type: "text", required: true },
    { name: "entityType", type: "text" },
    { name: "entityId", type: "text" },
    { name: "metadata", type: "json" },
    { name: "ipAddress", type: "text" },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.user && !data.actor) {
          data.actor = req.user.id;
        }
        return data;
      },
    ],
  },
};
