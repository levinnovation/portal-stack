import { renderPage } from "@/lib/blocks/render-page";

export const dynamic = "force-dynamic";

export default async function PreviewPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/") || "admin-overview";
  return renderPage({ slugPath, draft: true, portalPrefix: "/portal/admin" });
}
