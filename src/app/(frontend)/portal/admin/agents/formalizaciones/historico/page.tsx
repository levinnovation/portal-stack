import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { resolveTimeRange } from "@tenants/core/lib/time-range";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { FormalizacionesHistoricoScreen } from "@tenants/core/screens/formalizaciones-historico";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function FormalizacionesHistoricoPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const { from, to } = resolveTimeRange(params ?? {});

  return renderCustomScreen({
    title: "Formalizaciones · Histórico",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <FormalizacionesHistoricoScreen from={from} to={to} />,
  });
}
