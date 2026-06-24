import type { CollectionConfig } from "payload";

/**
 * Generic log of inbound webhooks (Agentyx, QuickBase, Stripe, etc).
 * Keeps an immutable audit trail of cross-service traffic.
 */
export const Webhooks: CollectionConfig = {
  slug: "webhooks",
  admin: { useAsTitle: "source", group: "Integrations" },
  access: {
    read: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    create: () => true, // accept system-level inserts from API routes
    update: () => false,
    delete: ({ req }) => req.user?.role === "superadmin",
  },
  fields: [
    {
      name: "source",
      type: "select",
      required: true,
      options: [
        { label: "Agentyx", value: "agentyx" },
        { label: "QuickBase", value: "quickbase" },
        { label: "Stripe", value: "stripe" },
        { label: "n8n", value: "n8n" },
        { label: "Otro", value: "other" },
      ],
    },
    { name: "event", type: "text" },
    { name: "payload", type: "json" },
    { name: "status", type: "select", defaultValue: "received", options: [
      { label: "Recibido", value: "received" },
      { label: "Procesado", value: "processed" },
      { label: "Falló", value: "failed" },
    ]},
    { name: "error", type: "textarea" },
  ],
};
