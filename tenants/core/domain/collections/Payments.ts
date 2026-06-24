import type { CollectionConfig } from "payload";

export const Payments: CollectionConfig = {
  slug: "payments",
  admin: { useAsTitle: "id" },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      if (req.user?.role === "customer") {
        return { "sale.customer.user": { equals: req.user.id } };
      }
      return false;
    },
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "sale",
      type: "relationship",
      relationTo: "sales",
      required: true,
    },
    { name: "amount", type: "number", required: true },
    { name: "dueDate", type: "date", required: true },
    { name: "paidDate", type: "date" },
    {
      name: "status",
      type: "select",
      defaultValue: "pending",
      required: true,
      options: [
        { label: "Pendiente", value: "pending" },
        { label: "Pagado", value: "paid" },
        { label: "Vencido", value: "overdue" },
      ],
    },
    { name: "paymentMethod", type: "text" },
    { name: "quickbaseRecordId", type: "text" },
  ],
};
