import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getPayloadClient } from "@/lib/payload";
import { getTenantId } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

export async function POST(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = (await req.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }

  const payload = await getPayloadClient();
  const tenantId = getTenantId();
  if (body.action === "set-active") {
    const templateId = Number(body.templateId);
    if (!Number.isInteger(templateId) || templateId < 1 || typeof body.active !== "boolean") return NextResponse.json({ error: "Datos inválidos" }, { status: 400 });
    const template = await payload.findByID({ collection: "email-templates", id: templateId, depth: 0, overrideAccess: true });
    if (template.tenantId !== tenantId) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });
    await payload.update({ collection: "email-templates", id: templateId, data: { active: body.active }, overrideAccess: true });
    return NextResponse.json({ ok: true });
  }

  if (body.action === "assign") {
    const templateId = Number(body.templateId);
    const agentSlug = typeof body.agentSlug === "string" && body.agentSlug ? body.agentSlug : undefined;
    const useCase = typeof body.useCase === "string" ? body.useCase : "shell";
    if (!Number.isInteger(templateId) || templateId < 1 || !SLUG.test(useCase) || (agentSlug && !SLUG.test(agentSlug))) {
      return NextResponse.json({ error: "Asignación inválida" }, { status: 400 });
    }
    const template = await payload.findByID({ collection: "email-templates", id: templateId, depth: 0, overrideAccess: true });
    if (template.tenantId !== tenantId) return NextResponse.json({ error: "Plantilla no encontrada" }, { status: 404 });

    const existing = await payload.find({
      collection: "email-template-bindings",
      where: {
        and: [
          { tenantId: { equals: tenantId } },
          { agentSlug: { equals: agentSlug || "" } },
          { useCase: { equals: useCase } },
        ],
      },
      limit: 1,
      depth: 0,
      overrideAccess: true,
    });
    const data = { tenantId, agentSlug, useCase, template: templateId, active: true };
    if (existing.docs[0]) {
      await payload.update({ collection: "email-template-bindings", id: existing.docs[0].id, data, overrideAccess: true });
    } else {
      await payload.create({ collection: "email-template-bindings", data, overrideAccess: true });
    }
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Acción no soportada" }, { status: 400 });
}
