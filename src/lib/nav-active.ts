import type { TenantNavItem } from "@/lib/tenant-types";

function itemMatches(pathname: string, item: TenantNavItem): boolean {
  if (item.kind === "group" || !item.to) return false;
  return item.end ? pathname === item.to : pathname === item.to || pathname.startsWith(item.to + "/");
}

/** Longest-prefix-wins: only one nav item active (fixes /agents + /agents/leah both highlighted). */
export function resolveActiveNavPath(pathname: string, items: TenantNavItem[]): string | null {
  const matches = items.filter((item) => itemMatches(pathname, item));
  if (!matches.length) return null;
  return matches.sort((a, b) => b.to.length - a.to.length)[0].to;
}
