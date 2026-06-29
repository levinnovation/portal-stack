"use client";

import { FlaskConical } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { money, num, pct } from "@tenants/core/lib/format";
import type { AbTestRecommendation, InteligenciaSnapshot } from "@tenants/core/sources/inteligencia";

type Campaign = InteligenciaSnapshot["campaigns"][number];
type CampaignAction = Campaign["action"];

const ACTION_TONE: Record<CampaignAction, string> = {
  scale: "bg-emerald-500/15 text-emerald-300 border-emerald-500/30",
  pause: "bg-rose-500/15 text-rose-300 border-rose-500/30",
  adjust: "bg-amber-500/15 text-amber-300 border-amber-500/30",
};

const PRIORITY_TONE: Record<AbTestRecommendation["priority"], string> = {
  high: "text-rose-300 bg-rose-400/10",
  medium: "text-amber-300 bg-amber-300/10",
  low: "text-emerald-300 bg-emerald-300/10",
};

/** When the engine has no explicit A/B test for this campaign, derive a sensible
 * detail-level suggestion from the recommended action so the detail view always
 * gives the user something concrete to run. */
function deriveAbTest(campaign: Campaign): AbTestRecommendation {
  const base = {
    campaign: campaign.name,
    primary_metric: "cost_per_reservation",
    expected_lift: 0.1,
    minimum_sample_size: Math.max(1000, Math.round((campaign.qualified || 0) * 10)),
    priority: "medium" as const,
    status: "suggested",
  };
  if (campaign.action === "scale") {
    return {
      ...base,
      priority: "high",
      hypothesis: `Escalar ${campaign.name} +20% de presupuesto mantiene el costo por reserva dentro del umbral.`,
      variant_a: "Presupuesto actual (control)",
      variant_b: "Presupuesto +20% manteniendo creativo y audiencia",
      rationale:
        "La campaña rinde por encima del promedio; la prueba valida que el rendimiento se sostiene al aumentar la inversión antes de escalar de forma permanente.",
    };
  }
  if (campaign.action === "pause") {
    return {
      ...base,
      priority: "high",
      primary_metric: "cost_per_qualified",
      hypothesis: `Refrescar el creativo de ${campaign.name} recupera el CPL antes de pausar definitivamente.`,
      variant_a: "Creativo actual (control)",
      variant_b: "Creativo nuevo + copy/CTA renovados",
      rationale:
        "El costo por resultado supera el umbral. Antes de pausar, una prueba de creativo determina si el problema es fatiga de anuncio o de oferta.",
    };
  }
  return {
    ...base,
    primary_metric: "cost_per_qualified",
    hypothesis: `Ajustar la audiencia de ${campaign.name} mejora la calidad de lead y baja el CPQL.`,
    variant_a: "Audiencia actual (control)",
    variant_b: "Audiencia refinada por lookalike de reservas",
    rationale:
      "El rendimiento es intermedio. Probar segmentación enfocada en compradores similares a los que reservan suele mejorar la eficiencia sin tocar presupuesto.",
  };
}

function MetricCell({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border bg-secondary/20 p-2.5">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}

export function RecommendationCard({
  action,
  title,
  reason,
  campaign,
  abTest,
}: {
  action: CampaignAction;
  title: string;
  reason: string;
  campaign?: Campaign;
  abTest?: AbTestRecommendation;
}) {
  const tone = ACTION_TONE[action];

  // No campaign payload → keep the original non-interactive card.
  if (!campaign) {
    return (
      <Card className="p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="text-sm font-semibold">{title}</p>
          <Badge className={tone}>{action.toUpperCase()}</Badge>
        </div>
        <p className="text-xs text-muted-foreground">{reason}</p>
      </Card>
    );
  }

  const test = abTest ?? deriveAbTest(campaign);
  const variantA = test.variantA ?? test.variant_a ?? "";
  const variantB = test.variantB ?? test.variant_b ?? "";
  const primaryMetric = test.primaryMetric ?? test.primary_metric ?? "cost_per_reservation";
  const expectedLift = Number(test.expectedLift ?? test.expected_lift ?? 0);
  const sampleSize = Number(test.minimumSampleSize ?? test.minimum_sample_size ?? 0);
  const isDerived = !abTest;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label={`Ver detalle y experimento A/B para ${title}`}
          className="w-full cursor-pointer rounded-xl bg-card p-4 text-left text-card-foreground ring-1 ring-foreground/10 outline-none transition-colors hover:bg-secondary/20 hover:ring-primary/50 focus-visible:ring-2 focus-visible:ring-primary"
        >
          <span className="mb-2 flex items-center justify-between gap-2">
            <span className="text-sm font-semibold">{title}</span>
            <Badge className={tone}>{action.toUpperCase()}</Badge>
          </span>
          <span className="block text-xs text-muted-foreground">{reason}</span>
          <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-medium text-primary">
            <FlaskConical className="h-3 w-3" />
            Ver experimento A/B
          </span>
        </button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-2 pr-8">
            <DialogTitle>{title}</DialogTitle>
            <Badge className={tone}>{action.toUpperCase()}</Badge>
          </div>
          <DialogDescription>{reason}</DialogDescription>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-5 overflow-y-auto">
          <section>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Rendimiento de campaña
            </p>
            <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
              <MetricCell label="Inversión" value={money(campaign.spend)} />
              <MetricCell label="Reservas" value={num(campaign.reservations)} />
              <MetricCell label="Calificados" value={num(campaign.qualified)} />
              <MetricCell label="Citas" value={num(campaign.meetings)} />
              {typeof campaign.ctr === "number" && <MetricCell label="CTR" value={pct(campaign.ctr)} />}
              {typeof campaign.cpm === "number" && <MetricCell label="CPM" value={money(campaign.cpm)} />}
              {typeof campaign.frequency === "number" && (
                <MetricCell label="Frecuencia" value={campaign.frequency.toFixed(1)} />
              )}
              {typeof campaign.costPerLead === "number" && (
                <MetricCell label="CPL" value={money(campaign.costPerLead)} />
              )}
              <MetricCell label="Costo / calificado" value={money(campaign.costPerQualified)} />
              {typeof campaign.costPerMeeting === "number" && (
                <MetricCell label="Costo / cita" value={money(campaign.costPerMeeting)} />
              )}
              <MetricCell label="Costo / reserva" value={money(campaign.costPerReservation)} />
              {typeof campaign.roas === "number" && (
                <MetricCell label="ROAS" value={`${campaign.roas.toFixed(2)}x`} />
              )}
            </div>
          </section>

          <section>
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <FlaskConical className="h-3.5 w-3.5 text-primary" />
                Experimento A/B sugerido
              </p>
              <span className={`rounded-full px-2 py-0.5 text-[11px] ${PRIORITY_TONE[test.priority]}`}>
                {test.priority}
              </span>
            </div>

            <p className="text-sm text-foreground">{test.hypothesis}</p>

            <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/20 p-3 text-xs">
                <p className="font-medium text-muted-foreground">Variante A (control)</p>
                <p className="mt-1 text-foreground">{variantA}</p>
              </div>
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 text-xs">
                <p className="font-medium text-muted-foreground">Variante B (prueba)</p>
                <p className="mt-1 text-foreground">{variantB}</p>
              </div>
            </div>

            <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
              <div>
                Métrica: <span className="text-foreground">{primaryMetric}</span>
              </div>
              <div>
                Lift esperado: <span className="text-foreground">{Math.round(expectedLift * 100)}%</span>
              </div>
              <div>
                Muestra mín.: <span className="text-foreground">{num(sampleSize)}</span>
              </div>
            </div>

            <p className="mt-3 text-xs text-muted-foreground">{test.rationale}</p>

            {isDerived && (
              <p className="mt-3 rounded-md border border-border bg-secondary/20 p-2 text-[11px] text-muted-foreground">
                Sugerencia derivada de la acción recomendada. El motor de experimentos aún no generó
                una prueba específica para esta campaña.
              </p>
            )}
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
