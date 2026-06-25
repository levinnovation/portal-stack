import { FlaskConical, Target, TrendingUp } from "lucide-react";

import { AbTestCard } from "@tenants/core/components/inteligencia/ab-test-card";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { num } from "@tenants/core/lib/format";
import { getInteligenciaData, type InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export async function InteligenciaExperimentosScreen({ run }: { run: InteligenciaRunType }) {
  const data = await getInteligenciaData(run);
  const highPriority = data.abTests.filter((test) => test.priority === "high").length;
  const avgLift =
    data.abTests.reduce((acc, test) => acc + Number(test.expected_lift ?? test.expectedLift ?? 0), 0) /
    Math.max(data.abTests.length, 1);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <KpiCard label="Experimentos recomendados" value={num(data.abTests.length)} icon={FlaskConical} />
        <KpiCard label="Alta prioridad" value={num(highPriority)} icon={Target} />
        <KpiCard label="Lift esperado promedio" value={`${Math.round(avgLift * 100)}%`} icon={TrendingUp} />
      </div>

      <SectionCard title="Motor de recomendaciones" description="Hipótesis generadas desde KRIs, campañas y embudo live">
        {data.abTests.length ? (
          <div className="grid grid-cols-1 gap-4">
            {data.abTests.map((test, index) => (
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
              />
            ))}
          </div>
        ) : (
          <EmptyState message="Sin experimentos recomendados" />
        )}
      </SectionCard>
    </div>
  );
}
