import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getConversionPorFuente } from "@tenants/core/sources/quickbase";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  try {
    return NextResponse.json(await getConversionPorFuente());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
