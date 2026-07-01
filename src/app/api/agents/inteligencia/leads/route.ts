import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getInteligenciaLeads, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const runType = (searchParams.get("run_type") || "12m") as InteligenciaRunType;
    const limitRaw = Number(searchParams.get("limit"));
    const leads = await getInteligenciaLeads(runType, {
      prescriptionId: searchParams.get("prescription_id") ?? undefined,
      direction: searchParams.get("direction") ?? undefined,
      temp: searchParams.get("temp") ?? undefined,
      segment: searchParams.get("segment") ?? undefined,
      campaign: searchParams.get("campaign") ?? undefined,
      owner: searchParams.get("owner") ?? undefined,
      limit: Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : undefined,
    });
    return NextResponse.json({ leads });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
