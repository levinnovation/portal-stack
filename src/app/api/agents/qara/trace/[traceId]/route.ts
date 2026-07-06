import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getRunEvents, getScoredForContact } from "@tenants/core/sources/langfuse";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Timeline en vivo de Qara desde Langfuse. El secreto vive solo aquí.
//  - events: spans scan/outreach de la traza del run (progreso en vuelo: nombre, canal, conteo).
//  - scored: cierre del lead (puntaje/outcome). Corre en otra traza, así que se correlaciona
//    por contactId + since (ms). Langfuse tiene lag de ingestión: si aún no hay datos,
//    devolvemos vacío (no es error) para que el panel siga sondeando.
export async function GET(req: NextRequest, ctx: { params: Promise<{ traceId: string }> }) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const { traceId } = await ctx.params;
  const contactId = req.nextUrl.searchParams.get("contactId") ?? "";
  const since = Number(req.nextUrl.searchParams.get("since") ?? "0") || 0;

  let events: Awaited<ReturnType<typeof getRunEvents>> = [];
  let scored: Awaited<ReturnType<typeof getScoredForContact>> = null;
  let lagError: string | undefined;

  try {
    events = await getRunEvents(traceId);
  } catch (e) {
    lagError = e instanceof Error ? e.message : String(e);
  }
  if (contactId) {
    try {
      scored = await getScoredForContact(contactId, since);
    } catch (e) {
      lagError = e instanceof Error ? e.message : String(e);
    }
  }

  return NextResponse.json({ events, scored, lagError }, { headers: { "Cache-Control": "no-store" } });
}
