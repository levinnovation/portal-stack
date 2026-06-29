import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getExternalAgent, getExternalAgentSchedule, setExternalAgentSchedule } from "@/lib/agents/external-agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ agentId: string }> };

export async function GET(_req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const { agentId } = await ctx.params;
  try {
    const agent = await getExternalAgent(agentId);
    const data = await getExternalAgentSchedule(agent);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ available: false, reason: error instanceof Error ? error.message : String(error) }, { status: 200 });
  }
}

export async function POST(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const { agentId } = await ctx.params;
  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  try {
    const agent = await getExternalAgent(agentId);
    const data = await setExternalAgentSchedule(agent, body);
    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    return NextResponse.json({ error: "No se pudo guardar el horario", detail: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}

