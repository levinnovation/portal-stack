import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getPayloadClient } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const COMMAND_PREFIXES = ["meta.", "hubspot.", "quickbase."];

export async function GET(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const limit = Math.min(Number(req.nextUrl.searchParams.get("limit") || 50) || 50, 200);

  try {
    const payload = await getPayloadClient();
    const result = await payload.find({
      collection: "audit-logs",
      where: {
        or: COMMAND_PREFIXES.map((prefix) => ({ action: { like: prefix } })),
      },
      sort: "-createdAt",
      limit,
      depth: 1,
      overrideAccess: true,
    });

    const items = result.docs.map((doc) => {
      const meta = (doc.metadata || {}) as Record<string, unknown>;
      const actor = doc.actor as { email?: string; id?: number } | number | null | undefined;
      return {
        id: doc.id,
        action: doc.action,
        entityType: doc.entityType,
        entityId: doc.entityId,
        createdAt: doc.createdAt,
        destructive: !!meta.destructive,
        actor: typeof actor === "object" && actor ? actor.email || `#${actor.id}` : actor ?? null,
        payload: meta.payload ?? null,
      };
    });

    return NextResponse.json({ items });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Command history failed", detail }, { status: 400 });
  }
}
