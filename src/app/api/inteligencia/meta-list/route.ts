import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import {
  listAds,
  listAdSets,
  listCampaigns,
  listCreatives,
  listCustomAudiences,
} from "@/lib/integrations/meta/marketing";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type MetaListItem = { id: string; name: string; status?: string };

function toItems(raw: unknown): MetaListItem[] {
  const rows = (raw as { data?: unknown[] })?.data;
  if (!Array.isArray(rows)) return [];
  return rows.map((row) => {
    const r = row as Record<string, unknown>;
    return {
      id: String(r.id ?? ""),
      name: String(r.name ?? r.id ?? ""),
      status: r.status ? String(r.status) : undefined,
    };
  });
}

export async function GET(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const type = req.nextUrl.searchParams.get("type") || "campaigns";
  const parentId = req.nextUrl.searchParams.get("parentId") || "";

  try {
    let raw: unknown;
    switch (type) {
      case "campaigns":
        raw = await listCampaigns();
        break;
      case "adsets":
        if (!parentId) return NextResponse.json({ error: "parentId (campaign) required" }, { status: 400 });
        raw = await listAdSets(parentId);
        break;
      case "ads":
        if (!parentId) return NextResponse.json({ error: "parentId (ad set) required" }, { status: 400 });
        raw = await listAds(parentId);
        break;
      case "creatives":
        raw = await listCreatives();
        break;
      case "audiences":
        raw = await listCustomAudiences();
        break;
      default:
        return NextResponse.json({ error: `Unknown list type: ${type}` }, { status: 400 });
    }
    return NextResponse.json({ items: toItems(raw) });
  } catch (error) {
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Meta list failed", detail }, { status: 400 });
  }
}
