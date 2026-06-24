import type { CollectionConfig } from "payload";

export const Notifications: CollectionConfig = {
  slug: "notifications",
  admin: { useAsTitle: "title" },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin" || req.user?.role === "superadmin") return true;
      if (req.user) return { user: { equals: req.user.id } };
      return false;
    },
    create: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    update: ({ req }) => {
      if (req.user?.role === "admin" || req.user?.role === "superadmin") return true;
      if (req.user) return { user: { equals: req.user.id } };
      return false;
    },
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
    },
    { name: "type", type: "text", required: true },
    { name: "title", type: "text", required: true },
    { name: "body", type: "textarea" },
    { name: "link", type: "text" },
    { name: "readAt", type: "date" },
  ],
};
