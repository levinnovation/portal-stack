import "server-only";

import { getPayloadClient } from "@/lib/payload";
import { getTenantId } from "@/lib/tenant";
export { interpolateEmailHtml } from "./interpolate";

type RecordLike = Record<string, unknown>;

export type EmailTemplateCatalogEntry = {
  id: string;
  tenantId: string;
  slug: string;
  name: string;
  description?: string;
  slotsSchema?: unknown;
  brand?: RecordLike;
  active: boolean;
  preview?: { url?: string; html?: string };
  render?: { html?: string; rendererUrl?: string; rendererRef?: string };
  source?: { provider?: string; version?: string; sourceRef?: string };
};

export type EmailTemplateBinding = {
  tenantId: string;
  agentSlug?: string;
  useCase: string;
  templateId: string;
  active: boolean;
};

function object(value: unknown): RecordLike {
  return value && typeof value === "object" && !Array.isArray(value) ? (value as RecordLike) : {};
}

function stringOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function normalizeTemplate(doc: RecordLike): EmailTemplateCatalogEntry {
  const preview = object(doc.preview);
  const render = object(doc.render);
  const source = object(doc.source);
  return {
    id: String(doc.id),
    tenantId: String(doc.tenantId || ""),
    slug: String(doc.slug || ""),
    name: String(doc.name || ""),
    description: stringOrUndefined(doc.description),
    slotsSchema: doc.slotsSchema,
    brand: object(doc.brand),
    active: doc.active !== false,
    preview: { url: stringOrUndefined(preview.url), html: stringOrUndefined(preview.html) },
    render: {
      html: stringOrUndefined(render.html),
      rendererUrl: stringOrUndefined(render.rendererUrl),
      rendererRef: stringOrUndefined(render.rendererRef),
    },
    source: {
      provider: stringOrUndefined(source.provider),
      version: stringOrUndefined(source.version),
      sourceRef: stringOrUndefined(source.sourceRef),
    },
  };
}

function relationId(value: unknown): string {
  return typeof value === "object" && value ? String((value as RecordLike).id || "") : String(value || "");
}

function normalizeBinding(doc: RecordLike): EmailTemplateBinding {
  return {
    tenantId: String(doc.tenantId || ""),
    agentSlug: stringOrUndefined(doc.agentSlug),
    useCase: String(doc.useCase || "shell"),
    templateId: relationId(doc.template),
    active: doc.active !== false,
  };
}

export async function listEmailTemplates(tenantId = getTenantId()): Promise<EmailTemplateCatalogEntry[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "email-templates",
    where: { tenantId: { equals: tenantId } },
    sort: "name",
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs.map((doc) => normalizeTemplate(doc as unknown as RecordLike));
}

export async function getEmailTemplate(slug: string, tenantId = getTenantId()): Promise<EmailTemplateCatalogEntry | null> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "email-templates",
    where: { and: [{ tenantId: { equals: tenantId } }, { slug: { equals: slug } }] },
    limit: 1,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs[0] ? normalizeTemplate(result.docs[0] as unknown as RecordLike) : null;
}

export async function listEmailTemplateBindings(tenantId = getTenantId()): Promise<EmailTemplateBinding[]> {
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "email-template-bindings",
    where: { tenantId: { equals: tenantId } },
    limit: 200,
    depth: 0,
    overrideAccess: true,
  });
  return result.docs.map((doc) => normalizeBinding(doc as unknown as RecordLike));
}

/** Agent/use-case overrides win, then agent shell, workspace use-case, and workspace shell. */
export async function resolveEmailTemplateBinding(
  template: EmailTemplateCatalogEntry,
  options: { tenantId?: string; agentSlug?: string; useCase?: string } = {},
): Promise<EmailTemplateBinding | null> {
  const tenantId = options.tenantId || getTenantId();
  const agentSlug = options.agentSlug;
  const useCase = options.useCase || "shell";
  const bindings = await listEmailTemplateBindings(tenantId);
  const candidates = [
    [agentSlug, useCase],
    [agentSlug, "shell"],
    [undefined, useCase],
    [undefined, "shell"],
  ] as const;
  for (const [agent, use] of candidates) {
    const binding = bindings.find((item) => item.active && item.templateId === template.id && item.agentSlug === agent && item.useCase === use);
    if (binding) return binding;
  }
  return null;
}
