import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { explainMetric } from "@/lib/ai/explain-metric";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ExplainSchema = z.object({
  label: z.string().min(1),
  kind: z.enum(["kpi", "chart", "table"]).optional(),
  description: z.string().optional(),
  formula: z.string().optional(),
  data: z.unknown().optional(),
});

/**
 * Generic "explain this dashboard element" endpoint shared by every agent BI
 * screen (Cashflows, and any future consumer of `<AiExplain>` /
 * `KpiCard`/`SectionCard`'s `aiExplain` prop). Same auth + AI resolution as
 * `/api/inteligencia/creative/score` — no per-agent wiring needed.
 */
export async function POST(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  let payload: z.infer<typeof ExplainSchema>;
  try {
    payload = ExplainSchema.parse(body);
  } catch (error) {
    return NextResponse.json({ error: "Payload inválido", detail: error instanceof Error ? error.message : String(error) }, { status: 400 });
  }

  try {
    const explanation = await explainMetric(payload);
    return NextResponse.json({ explanation });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "No se pudo generar la interpretación", detail }, { status: 502 });
  }
}
