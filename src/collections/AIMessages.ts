import type { CollectionConfig } from "payload";

export const AIMessages: CollectionConfig = {
  slug: "ai-messages",
  admin: { useAsTitle: "id", group: "AI", defaultColumns: ["role", "content", "createdAt"] },
  access: {
    read: ({ req }) => {
      if (!req.user) return false;
      if (req.user.role === "admin" || req.user.role === "superadmin") return true;
      return { "chat.user": { equals: req.user.id } };
    },
    create: ({ req }) => !!req.user,
    update: () => false,
    delete: ({ req }) => {
      if (req.user?.role === "admin" || req.user?.role === "superadmin") return true;
      if (req.user) return { "chat.user": { equals: req.user.id } };
      return false;
    },
  },
  fields: [
    {
      name: "chat",
      type: "relationship",
      relationTo: "ai-chats",
      required: true,
      index: true,
    },
    {
      name: "role",
      type: "select",
      required: true,
      options: [
        { label: "User", value: "user" },
        { label: "Assistant", value: "assistant" },
        { label: "System", value: "system" },
        { label: "Tool", value: "tool" },
      ],
    },
    { name: "content", type: "textarea", required: true },
    { name: "toolName", type: "text" },
    { name: "toolInput", type: "json" },
    { name: "toolOutput", type: "json" },
    { name: "tokens", type: "number" },
  ],
  timestamps: true,
};
