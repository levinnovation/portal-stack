import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getPayloadClient } from "@/lib/payload";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_UPLOAD_BYTES = 64 * 1024 * 1024;

export async function POST(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "file required" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json({ error: "file too large" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") && !file.type.startsWith("video/")) {
    return NextResponse.json({ error: "unsupported file type" }, { status: 400 });
  }

  const name = String(form.get("name") || file.name || "Creative asset");
  const alt = String(form.get("alt") || name);

  const payload = await getPayloadClient();
  const data = Buffer.from(await file.arrayBuffer());
  try {
    const doc = await payload.create({
      collection: "creative-assets" as any,
      data: {
        name,
        alt,
        status: "draft",
      },
      file: {
        data,
        mimetype: file.type,
        name: file.name || name,
        size: file.size,
      },
      overrideAccess: true,
    });
    return NextResponse.json({ asset: doc });
  } catch (err) {
    const detail = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: "upload failed", detail }, { status: 500 });
  }
}

export async function GET() {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  const payload = await getPayloadClient();
  const result = await payload.find({
    collection: "creative-assets" as any,
    limit: 100,
    sort: "-updatedAt",
    depth: 0,
    overrideAccess: true,
  });
  return NextResponse.json({ docs: result.docs });
}

