import type { CollectionConfig } from "payload";

export const Customers: CollectionConfig = {
  slug: "customers",
  admin: { useAsTitle: "fullName" },
  versions: { maxPerDoc: 20 },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      if (req.user?.role === "customer") {
        return { user: { equals: req.user.id } };
      }
      return false;
    },
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
    readVersions: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "user",
      type: "relationship",
      relationTo: "users",
      unique: true,
    },
    { name: "fullName", type: "text", required: true },
    { name: "email", type: "email" },
    { name: "phone", type: "text" },
    { name: "idNumber", type: "text" },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req }) => {
        if (doc.user && typeof doc.user === "object" && (doc.user as any).role !== "customer") {
          await req.payload.update({
            collection: "users",
            id: (doc.user as any).id,
            data: { role: "customer" },
            overrideAccess: true,
          });
        }
      },
    ],
  },
};
