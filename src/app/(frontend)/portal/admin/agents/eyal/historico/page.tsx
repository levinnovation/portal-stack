import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { resolveEyalWindow } from "@tenants/core/lib/eyal-window";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { EyalHistoricoScreen } from "@tenants/core/screens/eyal-historico";

export const dynamic = "force-dynamic";

type PageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function EyalHistoricoPage({ searchParams }: PageProps) {
  const params = searchParams ? await searchParams : {};
  const window = resolveEyalWindow(params?.window);

  return renderCustomScreen({
    title: "Eyal · Histórico",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <EyalHistoricoScreen window={window} />,
  });
}
