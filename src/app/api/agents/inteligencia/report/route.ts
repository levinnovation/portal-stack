import { NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  return NextResponse.json(
    {
      ok: false,
      error: "monthly_report_not_available_in_dashboard",
      message: "El PDF mensual debe venir desde el endpoint del agente de Inteligencia Comercial.",
    },
    { status: 501 },
  );
}
