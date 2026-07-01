import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getLeadProgress } from "@tenants/core/sources/hubspot";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Progreso de un lead puntual desde HubSpot — alimenta el status en vivo de una
// llamada/mensaje (Qara escribe el resultado en HubSpot al terminar). no-store: es
// polling en vivo.
export async function GET(_req: NextRequest, ctx: { params: Promise<{ contactId: string }> }) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const { contactId } = await ctx.params;
  try {
    const lead = await getLeadProgress(contactId);
    if (!lead) return NextResponse.json({ error: "lead_not_found" }, { status: 404 });
    return NextResponse.json(lead);
  } catch (e) {
    return NextResponse.json(
      { error: "No se pudo leer el lead en HubSpot", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }
}
