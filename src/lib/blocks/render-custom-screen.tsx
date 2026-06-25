import type { ReactNode } from "react";
import "server-only";
import { redirect } from "next/navigation";
import { PortalShell } from "@/components/PortalShell";
import { loadNavFromPages, mergeNavWithCustom } from "@/lib/blocks/load-nav";
import { canAccessPortalPrefix } from "@/lib/auth/portal-access";
import { getPayloadClient } from "@/lib/payload";
import { getSession } from "@/lib/session";
import { getTenant, type TenantNavItem } from "@/lib/tenant";

export interface RenderCustomScreenArgs {
  title: string;
  portalPrefix: string;
  roles: string[];
  children: ReactNode;
}

export async function renderCustomScreen({ title, portalPrefix, roles, children }: RenderCustomScreenArgs) {
  const user = await getSession();
  if (!user) redirect("/portal/auth");

  const tenant = await getTenant();
  const role = tenant.roles.find((r) => r.key === user.role);
  if (!role || !roles.includes(user.role)) {
    redirect(role?.homePath || "/portal/auth");
  }

  if (!canAccessPortalPrefix(portalPrefix, user.role)) {
    redirect(role.homePath);
  }

  let navOverride: TenantNavItem[] | undefined;
  if (tenant.features.navFromDb) {
    const payload = await getPayloadClient();
    navOverride = mergeNavWithCustom(await loadNavFromPages(payload, role), role);
  }

  return (
    <PortalShell user={user} tenant={tenant} role={role} title={title} navOverride={navOverride}>
      {children}
    </PortalShell>
  );
}
