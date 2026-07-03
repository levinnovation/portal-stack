import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { FormalizacionesDashboardScreen } from "@tenants/core/screens/formalizaciones-dashboard";

export const dynamic = "force-dynamic";

export default async function FormalizacionesPage() {
  return renderCustomScreen({
    title: "Formalizaciones · Dashboard",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <FormalizacionesDashboardScreen />,
  });
}
