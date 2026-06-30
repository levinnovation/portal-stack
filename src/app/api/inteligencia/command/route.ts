import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { executeChartCommand, listCommandKeys } from "@/lib/inteligencia/commands";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  return NextResponse.json({ commands: listCommandKeys() });
}

export async function POST(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  try {
    const out = await executeChartCommand(body, {
      actorId: auth.user.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });
    return NextResponse.json(out);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "No se pudo ejecutar el comando", detail: message }, { status: 400 });
  }
}

