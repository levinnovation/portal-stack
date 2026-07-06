import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getActiveRun } from "@tenants/core/sources/qara";

export const dynamic = "force-dynamic";

// Sondeada por el panel de control mientras está inactivo (sin run manual en curso) para
// descubrir un run disparado por el cron de Qara y abrir el mismo "Progreso en vivo" que
// usa el botón manual.
export async function GET() {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  try {
    return NextResponse.json(await getActiveRun());
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e) }, { status: 502 });
  }
}
