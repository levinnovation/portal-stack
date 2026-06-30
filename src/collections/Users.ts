import type { CollectionConfig, Access } from "payload";
import { coreTenant } from "@tenants/core/config";
import { finuTenant } from "@tenants/finu/config";
import { defaultTenant } from "@tenants/_default/config";

// JWT lifetime must match the login cookie maxAge (sessionDays). Without this,
// Payload's 2h default token expires while the 7d cookie persists, so requests
// after 2h hit "unauthorized" with a stale-but-present cookie.
function sessionTokenSeconds(): number {
  const id = process.env.TENANT_ID || process.env.NEXT_PUBLIC_TENANT_ID || "core";
  const tenant = ({ core: coreTenant, finu: finuTenant } as Record<string, typeof coreTenant>)[id] ?? defaultTenant;
  const days = tenant.auth.sessionDays ?? 7;
  return days * 24 * 60 * 60;
}

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
  auth: { tokenExpiration: sessionTokenSeconds() },
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
    {
      name: "themePreference",
      type: "select",
      required: true,
      defaultValue: "system",
      options: [
        { label: "Sistema", value: "system" },
        { label: "Claro", value: "light" },
        { label: "Oscuro", value: "dark" },
      ],
    },
    { name: "phone", type: "text" },
    { name: "avatar", type: "upload", relationTo: "media" },
  ],
};
