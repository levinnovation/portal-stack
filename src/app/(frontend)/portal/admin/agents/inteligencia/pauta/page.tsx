import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { resolveRun } from "@tenants/core/lib/inteligencia-run";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { InteligenciaPautaScreen } from "@tenants/core/screens/inteligencia-pauta";

export const dynamic = "force-dynamic";
export const revalidate = 300;

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function InteligenciaPautaPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : undefined;
  const run = resolveRun(params);

  return renderCustomScreen({
    title: "Inteligencia · Pauta",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <InteligenciaPautaScreen run={run} />,
  });
}
