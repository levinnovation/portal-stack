import { CalendarDays, CalendarClock, CalendarCheck, Video, MapPin } from "lucide-react";
import { KpiCard } from "@tenants/core/components/kpi-card";
import { SectionCard } from "@tenants/core/components/section-card";
import { EmptyState } from "@tenants/core/components/states/empty-state";
import { ErrorState } from "@tenants/core/components/states/error-state";
import { Donut } from "@/components/portal/charts/donut";
import { BarHorizontal } from "@/components/portal/charts/bar-horizontal";
import { getQaraCitas, type QaraCita } from "@tenants/core/sources/hubspot";
import { num } from "@tenants/core/lib/format";

// Formato de fecha determinista (sin Intl: el ICU de Node vs browser causa
// hydration mismatch; este screen es server-only pero mantenemos la regla).
const DIAS = ["dom", "lun", "mar", "mié", "jue", "vie", "sáb"];
const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

function fechaCita(ms: number | null): string {
  if (ms == null) return "—";
  // Las citas se agendan en hora de Costa Rica (UTC-6, sin DST).
  const d = new Date(ms - 6 * 60 * 60 * 1000);
  const h12 = d.getUTCHours() % 12 || 12;
  const ampm = d.getUTCHours() < 12 ? "a. m." : "p. m.";
  return `${DIAS[d.getUTCDay()]} ${d.getUTCDate()} ${MESES[d.getUTCMonth()]}, ${h12}:${String(
    d.getUTCMinutes()
  ).padStart(2, "0")} ${ampm}`;
}

function CitasTable({ citas, vacio }: { citas: QaraCita[]; vacio: string }) {
  if (!citas.length) return <EmptyState message={vacio} />;
  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
          <tr>
            <th className="px-3 py-2 font-medium">Lead</th>
            <th className="px-3 py-2 font-medium">Fecha</th>
            <th className="px-3 py-2 font-medium">Modalidad</th>
            <th className="px-3 py-2 font-medium">Asesor</th>
            <th className="px-3 py-2 font-medium">Proyecto</th>
            <th className="px-3 py-2 text-right font-medium">Score</th>
          </tr>
        </thead>
        <tbody>
          {citas.map((c) => (
            <tr key={`${c.contactId}-${c.fechaIso}`} className="border-t border-border">
              <td className="px-3 py-2">{c.nombre}</td>
              <td className="px-3 py-2 whitespace-nowrap">{fechaCita(c.fechaMs)}</td>
              <td className="px-3 py-2">
                {c.modo === "virtual" ? (
                  <span className="inline-flex items-center gap-1">
                    <Video className="h-3.5 w-3.5" /> Virtual
                  </span>
                ) : c.modo === "presencial" ? (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> Presencial
                  </span>
                ) : (
                  "—"
                )}
              </td>
              <td className="px-3 py-2">{c.asesor || "—"}</td>
              <td className="px-3 py-2">{c.proyecto || "—"}</td>
              <td className="px-3 py-2 text-right">{c.score != null ? c.score.toFixed(1) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export async function QaraCitasScreen() {
  let data: Awaited<ReturnType<typeof getQaraCitas>>;
  try {
    data = await getQaraCitas();
  } catch (e) {
    return (
      <ErrorState
        title="No se pudo leer HubSpot"
        detail={e instanceof Error ? e.message : "Error desconocido"}
      />
    );
  }

  const { kpis, proximas, recientes, porAsesor, porModo } = data;

  return (
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <KpiCard label="Citas agendadas" value={num(kpis.total)} icon={CalendarDays} hint="por Qara" />
        <KpiCard label="Próximas" value={num(kpis.proximas)} icon={CalendarClock} />
        <KpiCard label="Esta semana" value={num(kpis.estaSemana)} icon={CalendarCheck} />
        <KpiCard label="Virtuales" value={num(kpis.virtuales)} icon={Video} hint="Microsoft Teams" />
        <KpiCard label="Presenciales" value={num(kpis.presenciales)} icon={MapPin} hint="visita al proyecto" />
      </div>

      {/* Próximas citas */}
      <SectionCard
        title="Próximas citas"
        description="Citas creadas por Qara con el asesor asignado del lead (calendario real vía Murphy)"
      >
        <CitasTable citas={proximas} vacio="No hay citas próximas agendadas" />
      </SectionCard>

      {/* Distribuciones */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <SectionCard title="Citas por asesor" description="A quién se le están agendando los leads calificados">
          {porAsesor.length ? (
            <BarHorizontal data={porAsesor} format="num" />
          ) : (
            <EmptyState message="Aún no hay citas por asesor" />
          )}
        </SectionCard>
        <SectionCard title="Modalidad" description="Virtual (Teams) vs presencial en el proyecto">
          {porModo.length ? (
            <Donut data={porModo} format="num" />
          ) : (
            <EmptyState message="Aún no hay citas con modalidad" />
          )}
        </SectionCard>
      </div>

      {/* Historial reciente */}
      <SectionCard title="Citas recientes" description="Últimas citas ya pasadas (máx. 20)">
        <CitasTable citas={recientes} vacio="Aún no hay citas pasadas" />
      </SectionCard>
    </div>
  );
}
