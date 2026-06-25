import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getSchedule, setSchedule } from "@tenants/core/sources/qara";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  try {
    return NextResponse.json(await getSchedule());
  } catch (e) {
    return NextResponse.json(
      { available: false, reason: e instanceof Error ? e.message : String(e) },
      { status: 200 },
    );
  }
}

const hours = z.array(z.number().int().min(0).max(23)).min(1, "Elegí al menos una hora");
const schema = z.object({
  scan_hours: hours,
  cleanup_hours: hours,
  tz: z.string().default("America/Costa_Rica"),
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
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Horario inválido", detail: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }
  try {
    const saved = await setSchedule(parsed.data);
    return NextResponse.json({ ok: true, schedule: saved });
  } catch (e) {
    return NextResponse.json(
      { error: "No se pudo guardar el horario en Qara", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
