import { NextResponse } from "next/server";
import { getPayloadClient } from "@/lib/payload";
import { processWebhook } from "@/lib/integrations/process-webhook";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: Promise<{ source: string }> }) {
  const { source } = await params;
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const header = req.headers.get("x-webhook-secret");
    if (header !== secret) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "invalid json" }, { status: 400 });
  }

  const event = String(body.event || req.headers.get("x-webhook-event") || "unknown");
  const payload = await getPayloadClient();

  await payload.create({
    collection: "webhooks",
    data: { source: source as any, event, payload: body, status: "received" },
    overrideAccess: true,
  });

  try {
    const result = await processWebhook(payload, source, event, body);
    await payload.create({
      collection: "webhooks",
      data: { source: source as any, event, payload: { result, body }, status: result.ok ? "processed" : "failed" },
      overrideAccess: true,
    });
    return NextResponse.json(result, { status: result.ok ? 200 : 422 });
  } catch (e: any) {
    await payload.create({
      collection: "webhooks",
      data: { source: source as any, event, payload: body, status: "failed", error: e?.message },
      overrideAccess: true,
    });
    return NextResponse.json({ error: e?.message || "processing failed" }, { status: 500 });
  }
}
