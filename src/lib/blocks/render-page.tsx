/**
 * Higher-order helper that renders a Page (layout builder) inside a
 * portal shell, resolving datasets and applying the page's allowedRoles.
 */
import "server-only";
import { notFound, redirect } from "next/navigation";
import { getPayloadClient } from "@/lib/payload";
import { getTenant } from "@/lib/tenant";
import { getSession } from "@/lib/session";
import { canAccessPortalPrefix } from "@/lib/auth/portal-access";
import { resolvePageDatasets } from "@/lib/datasets/resolve";
import { BlockRenderer } from "@/lib/blocks/renderer";
import { PortalShell } from "@/components/PortalShell";

export interface RenderPageArgs {
  slugPath: string;          // "overview" or "projects/123"
  pageTitle?: string;        // override the shell title
  portalPrefix?: string;     // "/portal/admin" — enforces route prefix vs role
}

export async function renderPage({ slugPath, pageTitle, portalPrefix }: RenderPageArgs) {
  const user = await getSession();
  if (!user) redirect("/portal/auth");
  const tenant = await getTenant();
  const role = tenant.roles.find((r) => r.key === user.role);
  if (!role) redirect("/portal/auth");

  if (portalPrefix && !canAccessPortalPrefix(portalPrefix, user.role)) {
    redirect(role.homePath);
  }

  const payload = await getPayloadClient();
  const slug = slugPath.replace(/^\/+/, "");
  const { docs } = await payload.find({
    collection: "pages",
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  const page = docs[0] as any;
  if (!page) notFound();

  // Access check
  if (page.allowedRoles && Array.isArray(page.allowedRoles) && !page.allowedRoles.includes(user.role)) {
    notFound();
  }

  const data = await resolvePageDatasets(payload, page.layout || [], { user: { id: user.id, role: user.role } });

  return (
    <PortalShell user={user} tenant={tenant} role={role} title={pageTitle ?? page.title}>
      <BlockRenderer layout={page.layout || []} data={data} />
    </PortalShell>
  );
}
