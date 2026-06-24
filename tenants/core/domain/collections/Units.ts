import type { CollectionConfig } from "payload";

export const Units: CollectionConfig = {
  slug: "units",
  admin: { useAsTitle: "unitNumber" },
  access: {
    read: () => true,
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "project",
      type: "relationship",
      relationTo: "projects",
      required: true,
    },
    { name: "unitNumber", type: "text", required: true },
    { name: "floor", type: "number" },
    { name: "sqft", type: "number" },
    { name: "bedrooms", type: "number" },
    { name: "bathrooms", type: "number" },
    { name: "priceTotal", type: "number" },
    {
      name: "status",
      type: "select",
      defaultValue: "available",
      required: true,
      options: [
        { label: "Disponible", value: "available" },
        { label: "Reservada", value: "reserved" },
        { label: "Vendida", value: "sold" },
      ],
    },
  ],
};
