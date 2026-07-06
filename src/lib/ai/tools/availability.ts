import { isStaffRole } from "../scoping";
import type { SessionUser } from "../../auth/provider";
import type { TenantConfig } from "../../tenant-types";

export const extendedToolNames = [
  "bi_snapshot",
  "inteligencia_overview",
  "leah_attribution",
  "qara_leads",
  "meta_list",
  "list_portal_actions",
  "execute_portal_action",
] as const;

export function shouldEnableExtendedTools(user: SessionUser, tenant: TenantConfig): boolean {
  return isStaffRole(user.role) && tenant.id === "core";
}
