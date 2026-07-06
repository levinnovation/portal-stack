import "server-only";

import { generateObject } from "ai";
import { z } from "zod";
import { resolveLanguageModel } from "@/lib/ai/agent";

const PredictedCtrBand = z.enum(["low", "medium", "high"]);

export const CreativeScoreSchema = z.object({
  overall: z.number().min(0).max(100),
  hook: z.number().min(0).max(100),
  clarity: z.number().min(0).max(100),
  brandFit: z.number().min(0).max(100),
  cta: z.number().min(0).max(100),
  predictedCtrBand: PredictedCtrBand,
  strengths: z.array(z.string()).max(5),
  risks: z.array(z.string()).max(5),
  recommendations: z.array(z.string()).max(6),
});

export type CreativeScore = z.infer<typeof CreativeScoreSchema>;

const ScoreInputSchema = z.object({
  url: z.string().min(1),
  mimeType: z.string().min(1),
  context: z
    .object({
      goal: z.string().optional(),
      audience: z.string().optional(),
      offer: z.string().optional(),
      platform: z.string().optional(),
    })
    .optional(),
});

export async function scoreCreative(input: z.input<typeof ScoreInputSchema>): Promise<CreativeScore> {
  const payload = ScoreInputSchema.parse(input);
  const { model } = await resolveLanguageModel();
  const prompt = [
    "Evaluate this ad creative for Meta Ads performance.",
    "Return concise objective scoring only.",
    `Asset URL: ${payload.url}`,
    `Asset mimeType: ${payload.mimeType}`,
    payload.context?.goal ? `Goal: ${payload.context.goal}` : "",
    payload.context?.audience ? `Audience: ${payload.context.audience}` : "",
    payload.context?.offer ? `Offer: ${payload.context.offer}` : "",
    payload.context?.platform ? `Platform: ${payload.context.platform}` : "",
    "Use a strict 0-100 rubric for overall/hook/clarity/brandFit/cta and infer a CTR band.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateObject({
    model,
    schema: CreativeScoreSchema,
    prompt,
    temperature: 0.2,
  });
  return result.object;
}

