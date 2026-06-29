import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { triggerRun } from "@tenants/core/sources/qara";
import { getExternalAgent, runExternalAgentAction } from "@/lib/agents/external-agent";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("scan") }),
  z.object({
    mode: z.literal("single"),
    hubspot_contact_id: z.string().min(1, "Falta el ID de contacto"),
    channel: z.enum(["CALL", "WHATSAPP"]).default("WHATSAPP"),
  }),
]);

const actionSchema = z.object({
  action: z.enum(["scan", "single"]).optional(),
  payload: z.record(z.string(), z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  const parsed = schema.safeParse(body);
  const actionParsed = actionSchema.safeParse(body);
  if (!parsed.success && !actionParsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", detail: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  try {
    if (actionParsed.success) {
      const agent = await getExternalAgent("qara");
      const result = await runExternalAgentAction(agent, actionParsed.data as Record<string, unknown>);
      const asObj = (result as Record<string, unknown>) || {};
      return NextResponse.json(
        {
          traceId: String(asObj.traceId || asObj.trace_id || asObj.task_id || ""),
          status: String(asObj.status || "accepted"),
          ...asObj,
        },
        { status: 202 },
      );
    }
    if (!parsed.success) {
      return NextResponse.json({ error: "Parámetros inválidos para triggerRun" }, { status: 400 });
    }
    const { traceId, status } = await triggerRun(parsed.data);
    return NextResponse.json({ traceId, status }, { status: 202 });
  } catch (e) {
    return NextResponse.json(
      { error: "No se pudo iniciar el scan en Qara", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
