import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { CashflowsDashboardScreen } from "@tenants/core/screens/cashflows-dashboard";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function CashflowsPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const rawPeriod = params?.period_month;
  const rawProject = params?.project;
  const periodMonth = (Array.isArray(rawPeriod) ? rawPeriod[0] : rawPeriod) || undefined;
  const project = (Array.isArray(rawProject) ? rawProject[0] : rawProject) || undefined;

  return renderCustomScreen({
    title: "Cashflows · Dashboard",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <CashflowsDashboardScreen periodMonth={periodMonth} project={project} />,
  });
}
