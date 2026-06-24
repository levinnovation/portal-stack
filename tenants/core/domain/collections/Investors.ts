import type { CollectionConfig } from "payload";

export const Investors: CollectionConfig = {
  slug: "investors",
  admin: { useAsTitle: "fullName" },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      if (req.user?.role === "investor") {
        return { user: { equals: req.user.id } };
      }
      return false;
    },
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
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
    {
      name: "kycStatus",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pendiente", value: "pending" },
        { label: "En revisión", value: "in_review" },
        { label: "Aprobado", value: "approved" },
        { label: "Rechazado", value: "rejected" },
      ],
    },
    {
      name: "accreditationStatus",
      type: "select",
      defaultValue: "pending",
      options: [
        { label: "Pendiente", value: "pending" },
        { label: "Acreditado", value: "accredited" },
        { label: "No acreditado", value: "not_accredited" },
      ],
    },
  ],
  hooks: {
    afterChange: [
      async ({ doc, req, operation }) => {
        if (doc.user && typeof doc.user === "object" && (doc.user as any).role !== "investor") {
          await req.payload.update({
            collection: "users",
            id: (doc.user as any).id,
            data: { role: "investor" },
            overrideAccess: true,
          });
        }
      },
    ],
  },
};
