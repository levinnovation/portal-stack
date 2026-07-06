import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getPayloadClient } from "@/lib/payload";
import { metaGraph } from "@/lib/integrations/meta/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type LaunchedItem = {
  campaignId: string;
  name: string;
  launchedAt: string;
  launchedBy: string | number | null;
  status?: string;
  effectiveStatus?: string;
  objective?: string;
  dailyBudget?: string;
  live: boolean;
  error?: string;
};

export async function GET(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 40) || 40, 100);

  try {
    const payload = await getPayloadClient();
    const logs = await payload.find({
      collection: "audit-logs",
      where: { action: { equals: "meta.createCampaign" } },
      sort: "-createdAt",
      limit,
      depth: 1,
      overrideAccess: true,
    });

    // Dedupe by campaign id, keep the earliest launch record per campaign.
    const seen = new Map<string, { name: string; launchedAt: string; launchedBy: LaunchedItem["launchedBy"] }>();
    for (const doc of logs.docs) {
      const meta = (doc.metadata || {}) as Record<string, unknown>;
      const result = (meta.result || {}) as Record<string, unknown>;
      const payloadData = (meta.payload || {}) as Record<string, unknown>;
      const id = String(result.id || "");
      if (!id || seen.has(id)) continue;
      const actor = doc.actor as { email?: string; id?: number } | number | null | undefined;
      seen.set(id, {
        name: String(payloadData.name || id),
        launchedAt: String(doc.createdAt),
        launchedBy: typeof actor === "object" && actor ? actor.email || `#${actor.id}` : actor ?? null,
      });
    }

    const items: LaunchedItem[] = await Promise.all(
      [...seen.entries()].map(async ([campaignId, info]) => {
        try {
          const live = await metaGraph<Record<string, unknown>>("GET", `/${campaignId}`, {
            fields: "name,status,effective_status,objective,daily_budget",
          });
          return {
            campaignId,
            name: String(live.name || info.name),
            launchedAt: info.launchedAt,
            launchedBy: info.launchedBy,
            status: live.status ? String(live.status) : undefined,
            effectiveStatus: live.effective_status ? String(live.effective_status) : undefined,
            objective: live.objective ? String(live.objective) : undefined,
            dailyBudget: live.daily_budget ? String(live.daily_budget) : undefined,
            live: true,
          };
        } catch (e) {
          return {
            campaignId,
            name: info.name,
            launchedAt: info.launchedAt,
            launchedBy: info.launchedBy,
            live: false,
            error: e instanceof Error ? e.message : "no se pudo leer en Meta",
          };
        }
      }),
    );

    return NextResponse.json({ items });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Launched experiments failed", detail }, { status: 400 });
  }
}
