import "server-only";

import { getPayloadClient } from "@/lib/payload";
import { getTenant } from "@/lib/tenant";

type AuditArgs = {
  actorId?: number | string | null;
  action: string;
  entityType?: string;
  entityId?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
};

export async function writeAuditLog(args: AuditArgs): Promise<void> {
  const tenant = await getTenant();
  if (!tenant.features.auditLog) return;
  const payload = await getPayloadClient();
  await payload.create({
    collection: "audit-logs",
    data: {
      // ponytail: actor relationship currently typed as numeric user id in
      // generated Payload types; coerce strings from session providers.
      actor: args.actorId != null ? Number(args.actorId) : undefined,
      action: args.action,
      entityType: args.entityType,
      entityId: args.entityId,
      metadata: args.metadata || {},
      ipAddress: args.ipAddress || undefined,
    },
    overrideAccess: true,
  });
}

