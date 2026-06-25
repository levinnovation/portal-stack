"use server";
import type { Payload } from "payload";
import type { TenantNavItem, TenantRole } from "@/lib/tenant";

/** Keep config nav items with kind=custom when merging DB-driven nav. */
export function mergeNavWithCustom(dbNav: TenantNavItem[], role: TenantRole): TenantNavItem[] {
  const custom = role.nav.filter((n) => n.kind === "custom");
  const dbPaths = new Set(dbNav.map((n) => n.to));
  const extras = custom.filter((n) => !dbPaths.has(n.to));
  return [...dbNav, ...extras];
}

/** Build sidebar nav from Pages with showInNav when tenant.features.navFromDb is true. */
export async function loadNavFromPages(payload: Payload, role: TenantRole): Promise<TenantNavItem[]> {
  const { docs } = await payload.find({
    collection: "pages",
    where: {
      and: [
        { showInNav: { equals: true } },
        { allowedRoles: { contains: role.key } },
      ],
    },
    sort: "navOrder",
    limit: 50,
    depth: 0,
    overrideAccess: true,
  });

  return (docs as any[]).map((p) => {
    const home = role.homePath.replace(/\/$/, "");
    const path =
      p.navPath ||
      (p.slug === role.defaultLandingPageSlug ? home : `${home}/${String(p.slug).replace(new RegExp(`^${role.key}-`), "")}`);
    return {
      to: path,
      label: p.navLabel || p.title,
      icon: p.navIcon || "LayoutDashboard",
      end: path === home,
    } satisfies TenantNavItem;
  });
}
