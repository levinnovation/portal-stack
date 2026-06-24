import type { CollectionConfig } from "payload";

export const Investments: CollectionConfig = {
  slug: "investments",
  admin: { useAsTitle: "id" },
  versions: { maxPerDoc: 20 },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      if (req.user?.role === "investor") {
        return { "investor.user": { equals: req.user.id } };
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
      name: "investor",
      type: "relationship",
      relationTo: "investors",
      required: true,
    },
    {
      name: "project",
      type: "relationship",
      relationTo: "projects",
      required: true,
    },
    { name: "amountInvested", type: "number", required: true },
    { name: "investmentDate", type: "date", required: true },
    {
      name: "investmentType",
      type: "select",
      defaultValue: "equity",
      options: [
        { label: "Equity", value: "equity" },
        { label: "Deuda", value: "debt" },
        { label: "Preferred", value: "preferred" },
      ],
    },
    { name: "ownershipPercentage", type: "number" },
    {
      name: "status",
      type: "select",
      defaultValue: "active",
      options: [
        { label: "Activo", value: "active" },
        { label: "Cerrado", value: "closed" },
        { label: "Cancelado", value: "cancelled" },
      ],
    },
  ],
};
