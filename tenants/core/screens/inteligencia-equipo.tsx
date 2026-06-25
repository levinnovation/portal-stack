import { Gauge } from "@/components/portal/charts/gauge";
import { SectionCard } from "@tenants/core/components/section-card";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { num, pct } from "@tenants/core/lib/format";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";
import { loadInteligencia } from "@tenants/core/lib/inteligencia-run";

export async function InteligenciaEquipoScreen({ run }: { run: InteligenciaRunType }) {
  const loaded = await loadInteligencia(run);
  if (!loaded.ok) {
    return <ErrorState title="No se pudo leer Inteligencia BI" detail={loaded.error} />;
  }
  const data = loaded.data;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Show-up rate" description="Objetivo operativo mínimo 60%">
          <Gauge value={data.kpis.showUpRate} threshold={0.6} />
        </SectionCard>
        <SectionCard title="Cita -> reserva" description="Conversión de reuniones a reservas">
          <Gauge value={data.kpis.meetingToReservation} threshold={0.2} />
        </SectionCard>
      </div>

      <SectionCard title="Tabla por rep" description="Reuniones, reservas, show-up y score promedio">
        {data.reps.length ? (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
                <tr>
                  <th className="px-3 py-2">Rep</th>
                  <th className="px-3 py-2 text-right">Meetings</th>
                  <th className="px-3 py-2 text-right">Reservas</th>
                  <th className="px-3 py-2 text-right">Show-up</th>
                  <th className="px-3 py-2 text-right">Avg score</th>
                </tr>
              </thead>
              <tbody>
                {data.reps.map((rep) => (
                  <tr key={rep.name} className="border-t border-border/60">
                    <td className="px-3 py-2">{rep.name}</td>
                    <td className="px-3 py-2 text-right">{num(rep.meetings)}</td>
                    <td className="px-3 py-2 text-right">{num(rep.reservations)}</td>
                    <td className="px-3 py-2 text-right">{pct(rep.showUpRate)}</td>
                    <td className="px-3 py-2 text-right">{rep.avgScore.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <EmptyState message="Sin desempeño por rep para el periodo" />
        )}
      </SectionCard>
    </div>
  );
}