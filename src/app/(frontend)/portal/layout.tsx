import type { ReactNode } from "react";
import { FloatingChat } from "@/components/chat/FloatingChat";
import { getSession } from "@/lib/session";
import { getTenant } from "@/lib/tenant";
import { coreFloatingChatConfigByRole, type FloatingChatConfig } from "@tenants/core/ai/floating-chat";

function resolveFloatingChatConfig(tenantId: string, userRole: string): FloatingChatConfig {
  const roleKey = userRole === "superadmin" ? "admin" : userRole;

  if (tenantId === "core") {
    return coreFloatingChatConfigByRole[roleKey] ?? coreFloatingChatConfigByRole.admin;
  }

  return {
    title: "Asistente",
    agentId: "default",
    greeting: "Hola, soy tu asistente del portal. ¿En qué puedo ayudarte hoy?",
  };
}

export default async function PortalLayout({ children }: { children: ReactNode }) {
  const [user, tenant] = await Promise.all([getSession(), getTenant()]);
  const showChat = !!user && tenant.features.aiAgent && tenant.ai.enabled;
  const config = user ? resolveFloatingChatConfig(tenant.id, user.role) : null;
  // #region agent log
  console.log(
    "[debug-553f6b] PortalLayout showChat check",
    JSON.stringify({
      hasUser: !!user,
      userRole: user?.role,
      tenantId: tenant.id,
      aiAgent: tenant.features.aiAgent,
      aiEnabled: tenant.ai.enabled,
      showChat,
      hasConfig: !!config,
    }),
  );
  // #endregion

  return (
    <>
      {children}
      {showChat && config && (
        <FloatingChat
          title={config.title}
          agentId={config.agentId}
          greeting={config.greeting}
          suggestedPrompts={config.suggestedPrompts}
        />
      )}
    </>
  );
}
