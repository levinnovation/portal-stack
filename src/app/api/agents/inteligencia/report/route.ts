import { NextRequest, NextResponse } from "next/server";
import { requireAgentAdmin } from "@/lib/agents/require-agent-admin";
import { getInteligenciaData } from "@tenants/core/sources/inteligencia";
import { resolveRun } from "@tenants/core/lib/inteligencia-run";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// On-demand report download assembled from the reconciled silver snapshot.
// Works for any window (weekly/monthly/7d/1m/3m/6m/12m/full). Supports an
// optional section filter + free-text focus note for a custom follow-up report.
const ALL_SECTIONS = ["resumen", "kpis", "embudo", "campanas", "equipo", "riesgos", "prediccion"] as const;
type Section = (typeof ALL_SECTIONS)[number];

function fmtMoney(n: number): string {
  return new Intl.NumberFormat("es-CR", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n || 0);
}
function fmtPct(n: number): string {
  return `${((n || 0) * 100).toFixed(1)}%`;
}

export async function GET(req: NextRequest) {
  const auth = await requireAgentAdmin();
  if (auth.error) return auth.error;

  const sp = req.nextUrl.searchParams;
  const run = resolveRun({ run: sp.get("run_type") ?? undefined });
  const note = (sp.get("note") ?? "").trim();
  const sectionsParam = (sp.get("sections") ?? "").trim();
  const sections: Section[] = sectionsParam
    ? (sectionsParam.split(",").filter((s) => (ALL_SECTIONS as readonly string[]).includes(s)) as Section[])
    : [...ALL_SECTIONS];

  let data;
  try {
    data = await getInteligenciaData(run);
  } catch (e) {
    return NextResponse.json(
      { ok: false, error: "snapshot_unavailable", detail: e instanceof Error ? e.message : String(e) },
      { status: 502 }
    );
  }

  const k = data.kpis;
  const lines: string[] = [];
  lines.push(`# CORE · Inteligencia Comercial`);
  lines.push(`**Ventana:** ${run} — ${data.periodLabel}`);
  if (data.updatedAt) lines.push(`**Actualizado:** ${new Date(data.updatedAt).toLocaleString("es-CR")}`);
  lines.push(`**Generado:** ${new Date().toLocaleString("es-CR")}`);
  lines.push("");
  if (note) {
    lines.push(`> **Foco solicitado:** ${note}`);
    lines.push("");
  }

  if (sections.includes("resumen")) {
    lines.push(`## Resumen ejecutivo`);
    if (data.recommendations.length) data.recommendations.forEach((r) => lines.push(`- ${r}`));
    else lines.push(`- Sin recomendaciones registradas para el periodo.`);
    lines.push("");
  }
  if (sections.includes("kpis")) {
    lines.push(`## KPIs`);
    lines.push(`| Métrica | Valor |`);
    lines.push(`| --- | --- |`);
    lines.push(`| Leads | ${k.leads} |`);
    lines.push(`| Calificados | ${k.qualified} |`);
    lines.push(`| Citas | ${k.meetings} |`);
    lines.push(`| Reservas | ${k.reservations} |`);
    lines.push(`| Inversión pauta | ${fmtMoney(k.adSpend)} |`);
    lines.push(`| CAC | ${fmtMoney(k.cac)} |`);
    lines.push(`| Costo/Reserva | ${fmtMoney(k.costPerReservation)} |`);
    lines.push(`| ROAS | ${(k.roas || 0).toFixed(2)}x |`);
    lines.push(`| Show-up rate | ${fmtPct(k.showUpRate)} |`);
    lines.push(`| Forecast reservas (próx.) | ${k.forecastReservationsNextPeriod} |`);
    lines.push("");
  }
  if (sections.includes("embudo") && data.funnel.length) {
    lines.push(`## Embudo comercial`);
    data.funnel.forEach((f) => lines.push(`- **${f.name}:** ${f.value}`));
    lines.push("");
  }
  if (sections.includes("campanas")) {
    lines.push(`## Pauta por campaña`);
    if (data.campaigns.length) {
      lines.push(`| Campaña | Inversión | Reservas | Costo/Reserva | Acción |`);
      lines.push(`| --- | --- | --- | --- | --- |`);
      data.campaigns.forEach((c) =>
        lines.push(`| ${c.name} | ${fmtMoney(c.spend)} | ${c.reservations} | ${fmtMoney(c.costPerReservation)} | ${c.action} |`)
      );
    } else {
      lines.push(`Sin campañas en el periodo.`);
    }
    lines.push("");
  }
  if (sections.includes("equipo") && data.reps.length) {
    lines.push(`## Equipo comercial`);
    lines.push(`| Rep | Citas | Reservas | Show-up |`);
    lines.push(`| --- | --- | --- | --- |`);
    data.reps.forEach((r) => lines.push(`| ${r.name} | ${r.meetings} | ${r.reservations} | ${fmtPct(r.showUpRate)} |`));
    lines.push("");
  }
  if (sections.includes("riesgos") && data.kris.length) {
    lines.push(`## KRIs operativos`);
    data.kris.forEach((kri) =>
      lines.push(`- **${kri.name}** (${kri.status}): ${kri.value} / umbral ${kri.threshold} — ${kri.reason}`)
    );
    lines.push("");
  }
  if (sections.includes("prediccion")) {
    const fc = data.predictions.forecast_reservations_next_period ?? data.predictions.forecastReservationsNextPeriod ?? 0;
    lines.push(`## Predicción`);
    lines.push(`- Forecast de reservas próximo periodo: **${fc}**`);
    lines.push(`- Anomalías detectadas: ${data.predictions.anomalies?.length ?? 0}`);
    lines.push("");
  }

  const md = lines.join("\n");
  const filename = `core-inteligencia-${run}-${new Date().toISOString().slice(0, 10)}.md`;
  return new NextResponse(md, {
    status: 200,
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
