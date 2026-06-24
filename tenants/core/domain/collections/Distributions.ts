import type { CollectionConfig } from "payload";

export const Distributions: CollectionConfig = {
  slug: "distributions",
  admin: { useAsTitle: "id" },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin") return true;
      if (req.user?.role === "investor") {
        return { "investment.investor.user": { equals: req.user.id } };
      }
      return false;
    },
    create: ({ req }) => req.user?.role === "admin",
    update: ({ req }) => req.user?.role === "admin",
    delete: ({ req }) => req.user?.role === "admin",
  },
  fields: [
    {
      name: "investment",
      type: "relationship",
      relationTo: "investments",
      required: true,
    },
    { name: "amount", type: "number", required: true },
    { name: "distributionDate", type: "date", required: true },
    {
      name: "type",
      type: "select",
      defaultValue: "preferred_return",
      options: [
        { label: "Preferred Return", value: "preferred_return" },
        { label: "Catch-up", value: "catch_up" },
        { label: "Carried Interest", value: "carried_interest" },
        { label: "Return of Capital", value: "return_of_capital" },
      ],
    },
    { name: "description", type: "text" },
  ],
};
