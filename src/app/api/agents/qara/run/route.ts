import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { triggerRun } from "@tenants/core/sources/qara";

export const dynamic = "force-dynamic";

const schema = z.discriminatedUnion("mode", [
  z.object({ mode: z.literal("scan") }),
  z.object({
    mode: z.literal("single"),
    hubspot_contact_id: z.string().min(1, "Falta el ID de contacto"),
    channel: z.enum(["CALL", "WHATSAPP"]).default("WHATSAPP"),
  }),
]);

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
      { error: "Parámetros inválidos", detail: parsed.error.issues.map((i) => i.message).join("; ") },
      { status: 400 },
    );
  }

  try {
    const { traceId, status } = await triggerRun(parsed.data);
    return NextResponse.json({ traceId, status }, { status: 202 });
  } catch (e) {
    return NextResponse.json(
      { error: "No se pudo iniciar el scan en Qara", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 },
    );
  }
}
