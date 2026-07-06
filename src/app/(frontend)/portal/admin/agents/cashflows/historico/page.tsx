import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { resolveTimeRange } from "@tenants/core/lib/time-range";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { CashflowsHistoricoScreen } from "@tenants/core/screens/cashflows-historico";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CashflowsHistoricoPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { from, to } = resolveTimeRange(params ?? {}, "6m");

  return renderCustomScreen({
    title: "Cashflows · Histórico",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <CashflowsHistoricoScreen from={from} to={to} />,
  });
}
