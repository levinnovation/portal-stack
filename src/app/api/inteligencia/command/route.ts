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
  const startedAt = Date.now();
  const cmdKey = `${(body as { target?: string })?.target}.${(body as { op?: string })?.op}`;
  try {
    const out = await executeChartCommand(body, {
      actorId: auth.user.id,
      ipAddress: req.headers.get("x-forwarded-for") || undefined,
    });
    // Server-side observability: appears in Railway logs for live verification.
    console.log(
      `[inteligencia.command] OK ${cmdKey} actor=${auth.user.id} ms=${Date.now() - startedAt} destructive=${out.destructive}`,
    );
    return NextResponse.json(out);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(
      `[inteligencia.command] ERR ${cmdKey} actor=${auth.user.id} ms=${Date.now() - startedAt} detail=${message}`,
    );
    return NextResponse.json({ error: "No se pudo ejecutar el comando", detail: message }, { status: 400 });
  }
}

