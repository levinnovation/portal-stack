import { AbTestCard } from "@tenants/core/components/inteligencia/ab-test-card";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { getInteligenciaDataOrNull, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { WindowEmptyState } from "@tenants/core/components/inteligencia/window-empty-state";
import { LaunchedExperiments } from "@tenants/core/components/inteligencia/launched-experiments";
import { num } from "@tenants/core/lib/format";
import { FlaskConical, Target, TrendingUp } from "lucide-react";

/** Best-effort match of an A/B recommendation to a live campaign (by name) so
 * the card can offer pause/scale on the real base campaign. */
function matchCampaign(
  name: string | undefined,
  campaigns: { name: string; campaignId?: string; spend: number }[],
): { campaignId?: string; dailyBudget?: number } {
  if (!name) return {};
  const needle = name.trim().toLowerCase();
  const hit = campaigns.find((c) => {
    const n = c.name.trim().toLowerCase();
    return c.campaignId && (n === needle || n.includes(needle) || needle.includes(n));
  });
  if (!hit) return {};
  return { campaignId: hit.campaignId, dailyBudget: hit.spend > 0 ? hit.spend / 30 : undefined };
}

export async function InteligenciaExperimentosScreen({ run }: { run: InteligenciaRunType }) {
  let data: Awaited<ReturnType<typeof getInteligenciaDataOrNull>>;
  try {
    data = await getInteligenciaDataOrNull(run);
  } catch (err) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={String(err)} />;
  }
  if (!data) return <WindowEmptyState title="Inteligencia · Experimentos A/B" subtitle={`Recomendaciones live (${run})`} run={run} />;
  const highPriority = data.abTests.filter((test) => test.priority === "high").length;
  const avgLift =
    data.abTests.reduce((acc, test) => acc + Number(test.expected_lift ?? test.expectedLift ?? 0), 0) /
    Math.max(data.abTests.length, 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard label="Experimentos recomendados" value={num(data.abTests.length)} icon={FlaskConical} />
        <KpiCard label="Alta prioridad" value={num(highPriority)} icon={Target} status={highPriority ? "amber" : "green"} />
        <KpiCard label="Lift esperado promedio" value={`${Math.round(avgLift * 100)}%`} icon={TrendingUp} />
      </div>

      <SectionCard
        title="Campañas lanzadas desde el portal"
        description="Experimentos y campañas creadas con este panel — estado en vivo desde Meta"
      >
        <LaunchedExperiments autoRefreshMs={20000} />
      </SectionCard>

      <SectionCard title="Motor de recomendaciones" description="Hipótesis generadas desde KRIs, campañas y embudo live">
        {data.abTests.length ? (
          <div className="grid grid-cols-1 gap-4">
            {data.abTests.map((test, index) => {
              const match = matchCampaign(test.campaign, data.campaigns);
              return (
                <AbTestCard
                  key={test.id ?? `${test.hypothesis}-${index}`}
                  campaign={test.campaign}
                  hypothesis={test.hypothesis}
                  variantA={test.variantA ?? test.variant_a ?? ""}
                  variantB={test.variantB ?? test.variant_b ?? ""}
                  primaryMetric={test.primaryMetric ?? test.primary_metric ?? "cost_per_reservation"}
                  expectedLift={Number(test.expectedLift ?? test.expected_lift ?? 0)}
                  minimumSampleSize={Number(test.minimumSampleSize ?? test.minimum_sample_size ?? 0)}
                  priority={test.priority}
                  rationale={test.rationale}
                  baseCampaignId={match.campaignId}
                  baseDailyBudget={match.dailyBudget}
                />
              );
            })}
          </div>
        ) : (
          <EmptyState message="Sin experimentos recomendados" />
        )}
      </SectionCard>
    </div>
  );
}
