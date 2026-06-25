/**
 * Resolve seed pages for a tenant from tenants/<id>/pages.ts.
 * Convention: export `${id}Pages` (e.g. corePages, finuPages).
 */
import type { Page } from "@/collections/Pages";

export function tenantPagesExportName(tenantId: string): string {
  return `${tenantId}Pages`;
}

export async function loadTenantPages(tenantId: string): Promise<Page[]> {
  const exportName = tenantPagesExportName(tenantId);
  let mod: Record<string, unknown>;
  try {
    mod = await import(`../tenants/${tenantId}/pages.ts`);
  } catch {
    throw new Error(
      `[seed] Missing tenants/${tenantId}/pages.ts — create it or run pnpm tenant:new -- --id=${tenantId}`,
    );
  }
  const pages = mod[exportName];
  if (!Array.isArray(pages)) {
    throw new Error(
      `[seed] tenants/${tenantId}/pages.ts must export \`${exportName}\` as a Page[] array`,
    );
  }
  if (pages.length === 0) {
    throw new Error(
      `[seed] tenants/${tenantId}/pages.ts exports empty \`${exportName}\` — add at least one page stub`,
    );
  }
  return pages as Page[];
}
