import { renderPage } from "@/lib/blocks/render-page";

export const dynamic = "force-dynamic";

export default async function CustomerCatchallPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/") || "customer-overview";
  return renderPage({ slugPath });
}
