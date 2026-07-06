import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getAgentRunJob } from "@/lib/agents/agent-job-store";
import { getExternalAgent, getExternalAgentStatus } from "@/lib/agents/external-agent";
import { mapSpans, summarize, type Step } from "@tenants/core/lib/humanize";
import { getObservations } from "@tenants/core/sources/langfuse";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

type RouteCtx = { params: Promise<{ agentId: string; traceId: string }> };

async function qaraLangfuseStatus(traceId: string, since = "") {
  let steps: Step[] = [];
  let langfuseError: string | undefined;
  try {
    steps = mapSpans(await getObservations(traceId));
  } catch (error) {
    langfuseError = error instanceof Error ? error.message : String(error);
  }
  const idx = since ? steps.findIndex((step) => step.id === since) : -1;
  const newSteps = idx >= 0 ? steps.slice(idx + 1) : steps;
  return {
    steps: newSteps,
    total: steps.length,
    lastId: steps.length ? steps[steps.length - 1].id : since,
    summary: summarize(steps),
    langfuseError,
  };
}

export async function GET(req: NextRequest, ctx: RouteCtx) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const { agentId, traceId } = await ctx.params;
  const since = req.nextUrl.searchParams.get("since") ?? "";

  try {
    const agent = await getExternalAgent(agentId);
    const remote = await getExternalAgentStatus(agent, traceId);
    const local = getAgentRunJob(traceId);
    const base = typeof remote === "object" && remote !== null ? (remote as Record<string, unknown>) : { remote };

    if (agent.statusAdapter === "qara-langfuse") {
      const live = await qaraLangfuseStatus(traceId, since);
      const terminal = String(base.status || local?.status || "unknown");
      const done = terminal === "success" || terminal === "failed";
      return NextResponse.json({
        ...base,
        ...live,
        terminal,
        done,
      });
    }

    return NextResponse.json({
      ...base,
      localStatus: local?.status,
    });
  } catch (error) {
    const local = getAgentRunJob(traceId);
    if (local) return NextResponse.json(local);
    return NextResponse.json({ error: error instanceof Error ? error.message : String(error) }, { status: 502 });
  }
}

