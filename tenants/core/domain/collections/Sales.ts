import type { CollectionConfig } from "payload";

export const Sales: CollectionConfig = {
  slug: "sales",
  admin: { useAsTitle: "id" },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      if (req.user?.role === "customer") {
        return { "customer.user": { equals: req.user.id } };
      }
      return false;
    },
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "customer",
      type: "relationship",
      relationTo: "customers",
      required: true,
    },
    {
      name: "unit",
      type: "relationship",
      relationTo: "units",
      required: true,
    },
    { name: "saleDate", type: "date", required: true },
    { name: "priceAgreed", type: "number", required: true },
    { name: "paymentPlan", type: "json" },
    { name: "financingBank", type: "text" },
    { name: "financingAmount", type: "number" },
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
