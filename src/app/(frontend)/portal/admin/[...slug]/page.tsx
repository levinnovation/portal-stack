import { renderPage } from "@/lib/blocks/render-page";

export const dynamic = "force-dynamic";

type PageProps = {
  params: Promise<{ slug?: string[] }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function AdminCatchallPage({ params, searchParams }: PageProps) {
  const { slug } = await params;
  const slugPath = (slug ?? []).join("/") || "admin-overview";
  const resolved = searchParams ? await searchParams : undefined;
  const run = resolved?.run;
  return renderPage({
    slugPath,
    portalPrefix: "/portal/admin",
    params: { run: Array.isArray(run) ? run[0] : run },
  });
}
