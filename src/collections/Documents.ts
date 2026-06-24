import type { CollectionConfig } from "payload";

/**
 * Documents — generic file attachments scoped to any entity (project, sale, etc).
 * Visibility can be restricted by role; admins always see everything.
 */
export const Documents: CollectionConfig = {
  slug: "documents",
  admin: { useAsTitle: "name" },
  access: {
    read: ({ req }) => {
      if (req.user?.role === "admin" || req.user?.role === "superadmin") return true;
      if (req.user?.id) {
        return {
          or: [
            { uploadedBy: { equals: req.user.id } },
            { visibility: { equals: "all_users" } },
            { visibility: { equals: req.user.role } },
          ],
        } as any;
      }
      return false;
    },
    create: ({ req }) => !!req.user,
    update: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
    delete: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
  },
  upload: {
    staticDir: "public/media/documents",
    mimeTypes: [
      "application/pdf",
      "image/*",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.*",
    ],
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "entityType",
      type: "select",
      required: true,
      options: [
        { label: "Proyecto", value: "project" },
        { label: "Inversión", value: "investment" },
        { label: "Unidad", value: "unit" },
        { label: "Venta", value: "sale" },
        { label: "Genérico", value: "generic" },
      ],
    },
    { name: "entityId", type: "text", required: true },
    {
      name: "docType",
      type: "select",
      required: true,
      options: [
        { label: "Contrato", value: "contract" },
        { label: "Plano", value: "blueprint" },
        { label: "Licencia", value: "permit" },
        { label: "Pago / Recibo", value: "payment_receipt" },
        { label: "Legal", value: "legal" },
        { label: "Otro", value: "other" },
      ],
    },
    {
      name: "visibility",
      type: "select",
      defaultValue: "admin",
      options: [
        { label: "Solo Admin", value: "admin" },
        { label: "Inversionistas", value: "investor" },
        { label: "Clientes", value: "customer" },
        { label: "Todos los usuarios", value: "all_users" },
      ],
    },
    {
      name: "uploadedBy",
      type: "relationship",
      relationTo: "users",
      admin: { readOnly: true },
    },
  ],
  hooks: {
    beforeChange: [
      async ({ data, req }) => {
        if (req.user && !data.uploadedBy) {
          data.uploadedBy = req.user.id;
        }
        return data;
      },
    ],
  },
};
