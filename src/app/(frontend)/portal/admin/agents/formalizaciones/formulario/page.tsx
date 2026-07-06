import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AgentHeaderActions } from "@tenants/core/components/layout/agent-header-actions";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { FormalizacionesFormularioScreen } from "@tenants/core/screens/formalizaciones-formulario";

export const dynamic = "force-dynamic";

export default async function FormalizacionesFormularioPage() {
  return renderCustomScreen({
    title: "Formalizaciones · Formulario seguro",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    action: <AgentHeaderActions />,
    children: <FormalizacionesFormularioScreen />,
  });
}
