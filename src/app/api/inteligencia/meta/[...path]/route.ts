import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { metaGraph } from "@/lib/integrations/meta/graph";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ path: string[] }> };

export async function GET(req: NextRequest, ctx: Ctx) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  const params = await ctx.params;
  const path = `/${(params.path || []).map((part) => encodeURIComponent(part)).join("/")}`;
  const query: Record<string, string> = {};
  req.nextUrl.searchParams.forEach((value, key) => {
    query[key] = value;
  });
  try {
    const data = await metaGraph("GET", path, query);
    return NextResponse.json(data);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Meta read failed", detail: message }, { status: 400 });
  }
}

