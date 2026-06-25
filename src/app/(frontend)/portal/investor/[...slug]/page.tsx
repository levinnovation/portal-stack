import { renderPage } from "@/lib/blocks/render-page";

export const dynamic = "force-dynamic";

export default async function InvestorCatchallPage({ params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/") || "investor-portfolio";
  return renderPage({ slugPath, portalPrefix: "/portal/investor" });
}
