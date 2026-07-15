import { renderCustomScreen } from "@/lib/blocks/render-custom-screen";
import { AGENT_ADMIN_ROLES } from "@tenants/core/lib/screen-config";
import { EmailTemplatesScreen } from "@tenants/core/screens/email-templates";

export const dynamic = "force-dynamic";

export default async function EmailTemplatesPage() {
  return renderCustomScreen({
    title: "Plantillas de email",
    portalPrefix: "/portal/admin",
    roles: [...AGENT_ADMIN_ROLES],
    children: <EmailTemplatesScreen />,
  });
}
