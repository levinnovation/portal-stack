import { timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { getEmailTemplate, resolveEmailTemplateBinding } from "@/lib/email/catalog";
import { getTenantId, getTenant } from "@/lib/tenant";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SLUG = /^[a-z0-9][a-z0-9-]{0,63}$/;

function suppliedApiKey(req: NextRequest): string {
  const authorization = req.headers.get("authorization");
  return req.headers.get("x-api-key") || (authorization?.startsWith("Bearer ") ? authorization.slice(7) : "") || "";
}

function validApiKey(value: string): boolean {
  const expected = process.env.EMAIL_TEMPLATE_API_KEY || process.env.API_KEY;
  if (!expected || !value) return false;
  const actualBuffer = Buffer.from(value);
  const expectedBuffer = Buffer.from(expected);
  return actualBuffer.length === expectedBuffer.length && timingSafeEqual(actualBuffer, expectedBuffer);
}

export async function GET(req: NextRequest) {
  if (!validApiKey(suppliedApiKey(req))) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const slug = searchParams.get("slug")?.trim() || "";
  const workspace = searchParams.get("workspace")?.trim() || getTenantId();
  const agentSlug = searchParams.get("agent_slug")?.trim() || undefined;
  const useCase = searchParams.get("use_case")?.trim() || "shell";

  if (!SLUG.test(slug) || !SLUG.test(workspace) || (agentSlug && !SLUG.test(agentSlug)) || !SLUG.test(useCase)) {
    return NextResponse.json({ error: "Invalid slug, workspace, agent_slug, or use_case" }, { status: 400 });
  }
  if (workspace !== getTenantId()) {
    return NextResponse.json({ error: "workspace not available" }, { status: 404 });
  }

  try {
    const tenant = await getTenant();
    if (agentSlug && !tenant.externalAgents?.some((agent) => agent.id === agentSlug)) {
      return NextResponse.json({ error: "agent not available" }, { status: 404 });
    }

    const template = await getEmailTemplate(slug, workspace);
    if (!template || !template.active) {
      return NextResponse.json({ error: "template not found" }, { status: 404 });
    }
    const binding = await resolveEmailTemplateBinding(template, { tenantId: workspace, agentSlug, useCase });
    if (!binding) {
      return NextResponse.json({ error: "template is not assigned to this workspace or agent" }, { status: 404 });
    }

    return NextResponse.json(
      {
        template: {
          slug: template.slug,
          name: template.name,
          description: template.description,
          active: template.active,
          brand: template.brand,
          slots_schema: template.slotsSchema ?? { type: "object", additionalProperties: true },
          preview: template.preview,
          source: template.source,
          render: {
            html: template.render?.html,
            renderer_url: template.render?.rendererUrl,
            renderer_ref: template.render?.rendererRef,
          },
          contract: {
            html_format: "full_html_or_maizzle_renderer_reference",
            slot_syntax: "{{slot_name}}",
            renderer_required: !template.render?.html,
          },
        },
        binding: { workspace, agent_slug: binding.agentSlug, use_case: binding.useCase },
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch {
    return NextResponse.json({ error: "template catalog unavailable" }, { status: 503 });
  }
}
