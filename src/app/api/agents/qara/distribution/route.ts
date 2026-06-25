import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getQaraData } from "@tenants/core/sources/hubspot";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  try {
    const data = await getQaraData();
    const { kpis: _kpis, ...distribution } = data;
    return NextResponse.json(distribution);
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
