import type { CollectionConfig, Access } from "payload";

const isAdmin: Access = ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin";
const isAdminOrSelf: Access = ({ req }) => {
  if (!req.user) return false;
  if (req.user.role === "admin" || req.user.role === "superadmin") return true;
  return { id: { equals: req.user.id } };
};

/**
 * Generic Users collection.
 * Roles are tenant-agnostic at the DB level; each tenant defines its own
 * role labels and nav in tenants/<id>/config.ts. Use role keys that match
 * your tenant config (e.g. "admin" | "investor" | "customer" for Core).
 */
export const Users: CollectionConfig = {
  slug: "users",
  auth: true,
  admin: { useAsTitle: "email" },
  access: {
    create: isAdmin,
    delete: isAdmin,
    update: isAdminOrSelf,
    read: isAdminOrSelf,
  },
  fields: [
    { name: "name", type: "text", required: true },
    {
      name: "role",
      type: "select",
      required: true,
      defaultValue: "member",
      options: [
        { label: "Superadmin (platform)", value: "superadmin" },
        { label: "Admin (tenant team)", value: "admin" },
        { label: "Inversionista", value: "investor" },
        { label: "Cliente (Comprador)", value: "customer" },
        { label: "Member (genérico)", value: "member" },
      ],
      access: {
        update: ({ req }) => req.user?.role === "admin" || req.user?.role === "superadmin",
      },
    },
    { name: "phone", type: "text" },
    { name: "avatar", type: "upload", relationTo: "media" },
  ],
};
