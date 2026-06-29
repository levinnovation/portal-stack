import { runExternalDbTemplate } from "@/lib/integrations/external-db";
import type { DatasetHandler } from "./index";

/**
 * External DB dataset handler.
 * query = { db, template, params?: { runType, workspaceId, limit } }
 */
export const externalDbHandler: DatasetHandler = async (_payload, ctx, query) => {
  const db = String(query?.db || "");
  const template = String(query?.template || "");
  if (!db || !template) {
    return { error: "external-db handler needs query.db and query.template" };
  }
  const params = (query?.params as Record<string, unknown> | undefined) || {};

  const runType = String((ctx?.params?.run as string | undefined) || query?.runType || params.runType || "weekly");
  const workspaceId = String(
    query?.workspaceId ||
      params.workspaceId ||
      process.env.INTELIGENCIA_WORKSPACE_ID ||
      process.env.NEXT_PUBLIC_WORKSPACE_ID ||
      "core",
  );
  const limit = Number(query?.limit || params.limit || 50);

  return runExternalDbTemplate(db, template, { runType, workspaceId, limit });
};

