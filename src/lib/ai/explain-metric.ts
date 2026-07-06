import "server-only";

import { generateText } from "ai";
import { z } from "zod";
import { resolveLanguageModel } from "@/lib/ai/agent";

/**
 * On-demand, data-grounded interpretation for a dashboard KPI/chart/table.
 * Mirrors `src/lib/inteligencia/creative-score.ts` (same `resolveLanguageModel()`
 * + AI SDK call), but returns free text instead of a structured score — the
 * "explanation" is a 2-4 sentence read of the *actual current numbers* passed
 * in `data`, not a canned description (the static formula/description is
 * rendered instantly by the client without an LLM call; this only covers the
 * "so what does this mean right now" part).
 */
const ExplainInputSchema = z.object({
  label: z.string().min(1),
  kind: z.enum(["kpi", "chart", "table"]).default("kpi"),
  description: z.string().optional(),
  formula: z.string().optional(),
  data: z.unknown().optional(),
});

export type ExplainMetricInput = z.input<typeof ExplainInputSchema>;

function truncate(value: unknown, maxChars = 4000): string {
  const text = JSON.stringify(value, null, 2) ?? "null";
  return text.length > maxChars ? `${text.slice(0, maxChars)}\n… (truncado)` : text;
}

export async function explainMetric(input: ExplainMetricInput): Promise<string> {
  const payload = ExplainInputSchema.parse(input);
  const { model } = await resolveLanguageModel();

  const prompt = [
    `Eres un analista financiero explicando un ${payload.kind === "table" ? "tabla" : payload.kind === "chart" ? "gráfico" : "KPI"} de un dashboard interno a un equipo directivo no técnico.`,
    `Nombre: ${payload.label}`,
    payload.description ? `Qué muestra: ${payload.description}` : "",
    payload.formula ? `Fórmula/cálculo: ${payload.formula}` : "",
    payload.data !== undefined ? `Datos actuales (JSON):\n${truncate(payload.data)}` : "",
    "",
    "Escribe una interpretación breve (2-4 oraciones, español, sin markdown, sin listas) de lo que estos números concretos significan ahora mismo para el negocio: si hay algo bueno, riesgoso, o que amerite atención, dilo explícitamente citando las cifras relevantes. No inventes datos que no estén en el JSON. Si no hay datos suficientes, dilo brevemente.",
  ]
    .filter(Boolean)
    .join("\n");

  const result = await generateText({ model, prompt, temperature: 0.3 });
  return result.text.trim();
}
