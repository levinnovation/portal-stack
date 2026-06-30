import { FlaskConical } from "lucide-react";

import { Card } from "@/components/ui/card";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";

// Map the experiment's primary metric to a Meta campaign objective.
function objectiveForMetric(metric: string): string {
  const m = metric.toLowerCase();
  if (m.includes("reservation") || m.includes("lead") || m.includes("qualified") || m.includes("cpl")) return "OUTCOME_LEADS";
  if (m.includes("revenue") || m.includes("roas") || m.includes("purchase") || m.includes("sale")) return "OUTCOME_SALES";
  if (m.includes("click") || m.includes("ctr") || m.includes("traffic")) return "OUTCOME_TRAFFIC";
  return "OUTCOME_LEADS";
}

export function AbTestCard({
  campaign,
  hypothesis,
  variantA,
  variantB,
  primaryMetric,
  expectedLift,
  minimumSampleSize,
  priority,
  rationale,
  baseCampaignId,
  baseDailyBudget,
}: {
  campaign?: string;
  hypothesis: string;
  variantA: string;
  variantB: string;
  primaryMetric: string;
  expectedLift: number;
  minimumSampleSize: number;
  priority: "low" | "medium" | "high";
  rationale: string;
  baseCampaignId?: string;
  baseDailyBudget?: number;
}) {
  const priorityClass =
    priority === "high" ? "text-rose-300 bg-rose-400/10" : priority === "medium" ? "text-amber-300 bg-amber-300/10" : "text-emerald-300 bg-emerald-300/10";
  const today = new Date().toISOString().slice(0, 10);
  const experimentName = `A/B · ${campaign || "Experimento"} · ${today}`;
  const objective = objectiveForMetric(primaryMetric);

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold">
          <FlaskConical className="h-4 w-4 text-primary" />
          {campaign || "Experimento"}
        </div>
        <span className={`rounded-full px-2 py-1 text-xs ${priorityClass}`}>{priority}</span>
      </div>
      <p className="mt-3 text-sm text-foreground">{hypothesis}</p>
      <div className="mt-4 grid grid-cols-1 gap-3 text-xs md:grid-cols-2">
        <div className="rounded-lg border border-border bg-secondary/20 p-3">
          <p className="font-medium text-muted-foreground">Variant A</p>
          <p className="mt-1">{variantA}</p>
        </div>
        <div className="rounded-lg border border-border bg-secondary/20 p-3">
          <p className="font-medium text-muted-foreground">Variant B</p>
          <p className="mt-1">{variantB}</p>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
        <div>Metric: <span className="text-foreground">{primaryMetric}</span></div>
        <div>Lift: <span className="text-foreground">{Math.round(expectedLift * 100)}%</span></div>
        <div>Sample: <span className="text-foreground">{minimumSampleSize}</span></div>
      </div>
      <p className="mt-3 text-xs text-muted-foreground">{rationale}</p>

      {/* Immediate actions — turn the recommendation into a live launch / control */}
      <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border/60 pt-3">
        <CommandControl
          label="Lanzar experimento"
          target="meta"
          op="createCampaign"
          payload={{ name: experimentName, objective, status: "PAUSED", special_ad_categories: [] }}
          description={`Crea una campaña PAUSADA en Meta para "${experimentName}" (objetivo ${objective}). Aparecerá en Campañas lanzadas para activarla.`}
          showResult
        />
        {baseCampaignId ? (
          <>
            <CommandControl
              label="Pausar base"
              target="meta"
              op="pauseCampaign"
              payload={{ campaignId: baseCampaignId }}
              variant="danger"
              description={`Pausar la campaña base de "${campaign}" en Meta`}
            />
            <CommandControl
              label="Escalar base +20%"
              target="meta"
              op="updateCampaign"
              payload={{ campaignId: baseCampaignId, dailyBudget: Math.max((baseDailyBudget || 25) * 1.2, 1) }}
              variant="ghost"
              description="Subir 20% el presupuesto diario de la campaña base"
            />
          </>
        ) : null}
      </div>
    </Card>
  );
}
