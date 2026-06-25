/**
 * Higher-order helper that renders a Page (layout builder) inside a portal shell.
 */
import "server-only";
import { notFound, redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/session";
import { canAccessPortalPrefix } from "@/lib/auth/portal-access";
import { resolveTenantRole } from "@/lib/auth/resolve-tenant-role";
import { resolvePageDatasets } from "@/lib/datasets/resolve";
import { BlockRenderer } from "@/lib/blocks/renderer";
import { PortalShell } from "@/components/PortalShell";
import { resolvePageSlugCandidates } from "@/lib/blocks/page-slug";
import { normalizeLayout } from "@/lib/blocks/normalize-layout";
import { loadNavFromPages, mergeNavWithCustom } from "@/lib/blocks/load-nav";

export interface RenderPageArgs {
  slugPath: string;
  pageTitle?: string;
  portalPrefix?: string;
  draft?: boolean;
}

async function findPage(payload: Awaited<ReturnType<typeof getPayloadClient>>, slug: string, draft: boolean) {
  const result = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    overrideAccess: true,
    draft,
  });
  return result.docs[0] as any;
}

export async function renderPage({ slugPath, pageTitle, portalPrefix, draft = false }: RenderPageArgs) {
  const user = await getSession();
  if (!user) redirect("/portal/auth");
  const tenant = await getTenant();
  if (!tenant.features.layoutBuilder) notFound();

  const role = resolveTenantRole(tenant, user.role);
  if (!role) redirect("/portal/auth");

  if (portalPrefix && !canAccessPortalPrefix(portalPrefix, user.role)) {
    redirect(role.homePath);
  }

  if (draft && user.role !== "admin" && user.role !== "superadmin") {
    notFound();
  }

  const payload = await getPayloadClient();
  const candidates = resolvePageSlugCandidates(slugPath, portalPrefix);
  let page: any;
  for (const slug of candidates) {
    page = await findPage(payload, slug, draft);
    if (page) break;
  }
  if (!page) notFound();

  if (page.allowedRoles && Array.isArray(page.allowedRoles) && !page.allowedRoles.includes(user.role)) {
    notFound();
  }

  const layout = normalizeLayout(page.layout || []);
  const data = await resolvePageDatasets(payload, layout as any[], { user: { id: user.id, role: user.role } });

  const navOverride =
    tenant.features.navFromDb
      ? mergeNavWithCustom(await loadNavFromPages(payload, role), role)
      : undefined;

  return (
    <PortalShell user={user} tenant={tenant} role={role} title={pageTitle ?? page.title} navOverride={navOverride}>
      <BlockRenderer layout={layout} data={data} />
    </PortalShell>
  );
}
