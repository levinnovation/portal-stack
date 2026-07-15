import { EmailTemplateCatalog } from "@tenants/core/components/email-template-catalog";
import { listEmailTemplateBindings, listEmailTemplates } from "@/lib/email/catalog";
import { getTenant } from "@/lib/tenant";

export async function EmailTemplatesScreen() {
  const [templates, bindings, tenant] = await Promise.all([listEmailTemplates(), listEmailTemplateBindings(), getTenant()]);
  return (
    <EmailTemplateCatalog
      templates={templates}
      bindings={bindings}
      agents={(tenant.externalAgents || []).map((agent) => ({ id: agent.id, label: agent.label }))}
    />
  );
}
