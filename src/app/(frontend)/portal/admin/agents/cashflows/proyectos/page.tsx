import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { CashflowsProyectosScreen } from "@tenants/core/screens/cashflows-proyectos";

export const dynamic = "force-dynamic";

export default async function CashflowsProyectosPage() {
  return renderCustomScreen({
    title: "Cashflows · Proyectos",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <CashflowsProyectosScreen />,
  });
}
