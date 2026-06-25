import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { mapSpans, summarize, type Step } from "@tenants/core/lib/humanize";
import { getObservations } from "@tenants/core/sources/langfuse";
import { getJob } from "@tenants/core/sources/qara";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest, ctx: { params: Promise<{ traceId: string }> }) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const { traceId } = await ctx.params;
  const since = req.nextUrl.searchParams.get("since") ?? "";

  let steps: Step[] = [];
  let langfuseError: string | undefined;
  try {
    steps = mapSpans(await getObservations(traceId));
  } catch (e) {
    langfuseError = e instanceof Error ? e.message : String(e);
  }

  let nuevos = steps;
  if (since) {
    const idx = steps.findIndex((s) => s.id === since);
    nuevos = idx >= 0 ? steps.slice(idx + 1) : steps;
  }

  let terminal: "running" | "success" | "failed" | "unknown" = "running";
  try {
    terminal = (await getJob(traceId)).status;
  } catch {
    terminal = "unknown";
  }

  const done = terminal === "success" || terminal === "failed";
  return NextResponse.json({
    steps: nuevos,
    lastId: steps.length ? steps[steps.length - 1].id : since,
    total: steps.length,
    terminal,
    done,
    summary: done ? summarize(steps) : null,
    langfuseError,
  });
}
