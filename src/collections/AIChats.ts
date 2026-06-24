import type { CollectionConfig } from "payload";

export const AIChats: CollectionConfig = {
  slug: "ai-chats",
  admin: { useAsTitle: "title", group: "AI" },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin" || req.user?.role === "superadmin") return true;
      if (req.user) return { user: { equals: req.user.id } };
      return false;
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => {
      if (req.user?.role === "admin" || req.user?.role === "superadmin") return true;
      if (req.user) return { user: { equals: req.user.id } };
      return false;
    },
    delete: ({ req }) => {
      if (req.user?.role === "admin" || req.user?.role === "superadmin") return true;
      if (req.user) return { user: { equals: req.user.id } };
      return false;
    },
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      required: true,
      index: true,
    },
    {
      name: "agentId",
      type: "text",
      defaultValue: "default",
      admin: { description: "Maps to a system prompt in tenants/<id>/ai/" },
    },
    { name: "title", type: "text" },
  ],
  timestamps: true,
};
