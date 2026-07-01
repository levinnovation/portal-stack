import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getPayloadClient } from "@/lib/payload";
import { scoreCreative } from "@/lib/inteligencia/creative-score";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ScoreSchema = z.object({
  creativeAssetId: z.union([z.string(), z.number()]),
  context: z
    .object({
      goal: z.string().optional(),
      audience: z.string().optional(),
      offer: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
});

export async function POST(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Body JSON inválido" }, { status: 400 });
  }
  const payload = ScoreSchema.parse(body);
  const p = await getPayloadClient();
  const asset = await p.findByID({
    collection: "creative-assets" as any,
    id: payload.creativeAssetId,
    depth: 0,
    overrideAccess: true,
  });
  const url = String((asset as any).url || "");
  const mimeType = String((asset as any).mimeType || "");
  if (!url) return NextResponse.json({ error: "Asset URL missing" }, { status: 400 });

  try {
    const score = await scoreCreative({ url, mimeType, context: payload.context });
    const feedback = [
      ...(score.strengths.length ? [`Fortalezas: ${score.strengths.join("; ")}`] : []),
      ...(score.risks.length ? [`Riesgos: ${score.risks.join("; ")}`] : []),
      ...(score.recommendations.length ? [`Sugerencias: ${score.recommendations.join("; ")}`] : []),
    ].join("\n");
    const updated = await p.update({
      collection: "creative-assets" as any,
      id: payload.creativeAssetId,
      data: {
        status: "scored",
        score: score.overall,
        scoreBreakdown: score,
        scoreFeedback: feedback,
      },
      overrideAccess: true,
    });
    return NextResponse.json({ asset: updated, score });
  } catch (error) {
    await p.update({
      collection: "creative-assets" as any,
      id: payload.creativeAssetId,
      data: { status: "failed" },
      overrideAccess: true,
    });
    const detail = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: "Creative scoring failed", detail }, { status: 400 });
  }
}

