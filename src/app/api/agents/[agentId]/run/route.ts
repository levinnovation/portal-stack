import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { setAgentRunJob } from "@/lib/agents/agent-job-store";
import { getExternalAgent, runExternalAgentAction } from "@/lib/agents/external-agent";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ agentId: string }> };

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
    const traceId = String(body.traceId || body.trace_id || body.task_id || randomUUID());
    setAgentRunJob(traceId, { agentId, status: "running", startedAt: new Date().toISOString() });
    const result = await runExternalAgentAction(agent, body);
    setAgentRunJob(traceId, { agentId, status: "success", startedAt: new Date().toISOString(), result });
    const response = typeof result === "object" && result !== null ? (result as Record<string, unknown>) : { result };
    return NextResponse.json({ traceId, taskId: traceId, status: "accepted", ...response }, { status: 202 });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "No se pudo ejecutar la acción del agente", detail: message }, { status: 502 });
  }
}

