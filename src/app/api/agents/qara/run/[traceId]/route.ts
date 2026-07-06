import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getJob } from "@tenants/core/sources/qara";

export const dynamic = "force-dynamic";

export async function GET(_req: Request, ctx: { params: Promise<{ traceId: string }> }) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  const { traceId } = await ctx.params;
  try {
    return NextResponse.json(await getJob(traceId));
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
