import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getInteligenciaPosts, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  try {
    const { searchParams } = new URL(req.url);
    const runType = (searchParams.get("run_type") || "weekly") as InteligenciaRunType;
    const limitRaw = Number(searchParams.get("limit"));
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? limitRaw : 50;
    const posts = await getInteligenciaPosts(runType, limit);
    return NextResponse.json({ posts });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
