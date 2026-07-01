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
  let runComplete = false;
  let langfuseError: string | undefined;
  try {
    const observations = await getObservations(traceId);
    steps = mapSpans(observations);
    // Señal terminal explícita que emite el flow ("Qara terminó").
    runComplete = observations.some((o) => (o.name ?? "").toLowerCase().includes("run_complete"));
  } catch (e) {
    langfuseError = e instanceof Error ? e.message : String(e);
  }

  let nuevos = steps;
  if (since) {
    const idx = steps.findIndex((s) => s.id === since);
    nuevos = idx >= 0 ? steps.slice(idx + 1) : steps;
  }

  // El evento run_complete de Langfuse manda el cierre; el job en memoria de Qara
  // (getJob) queda solo como respaldo — devolvía "unknown" tras un restart y dejaba
  // el panel girando para siempre.
  let terminal: "running" | "success" | "failed" | "unknown" = "running";
  if (runComplete) {
    terminal = "success";
  } else {
    try {
      terminal = (await getJob(traceId)).status;
    } catch {
      terminal = "unknown";
    }
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
