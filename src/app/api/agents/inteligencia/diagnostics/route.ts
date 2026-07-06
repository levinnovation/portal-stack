import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getInteligenciaData, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const run = searchParams.get("run_type") === "monthly" ? "monthly" : "weekly";
    const data = await getInteligenciaData(run as InteligenciaRunType);
    return NextResponse.json(data.diagnostics);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
