import { tool } from "ai";
import { z } from "zod";
import type { SessionUser } from "../../auth/provider";
import { isStaffRole } from "../scoping";
import { listCommandCatalog } from "@/lib/inteligencia/commands";

function forbidden() {
  return { error: "forbidden" };
}

export function buildActionTools(user: SessionUser) {
  return {
    list_portal_actions: tool({
      description: "List executable portal action keys and whether they are destructive. Admin-only.",
      inputSchema: z.object({}),
      execute: async () => {
        if (!isStaffRole(user.role)) return forbidden();
        return { actions: listCommandCatalog() };
      },
    }),

    execute_portal_action: tool({
      description:
        "Propose a portal action to execute. Requires explicit user confirmation in the chat UI before the browser runs it.",
      inputSchema: z.object({
        target: z.string().min(1),
        op: z.string().min(1),
        payload: z.record(z.any()).default({}),
      }),
    }),
  };
}
