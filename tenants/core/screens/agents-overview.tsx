import { DollarSign, FileSignature, Users, Flame } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getLeahOverview } from "@tenants/core/sources/quickbase";
import { getQaraOverview } from "@tenants/core/sources/hubspot";

function money(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
}

/** Pilot custom screen — pattern from core-dashboard /overview (simplified). */
export async function AgentsOverviewScreen() {
  const [leah, qara] = await Promise.all([getLeahOverview(), getQaraOverview()]);

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Salida en vivo de agentes CORE — atribución (Leah / QuickBase) y leads (Qara / HubSpot). Pantalla custom en{" "}
        <code className="text-xs">tenants/core/screens/</code>.
      </p>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          label="Monto atribuido"
          value={leah.configured && !leah.error ? money(leah.kpis.montoMes) : "—"}
          hint="Leah"
          icon={<DollarSign className="h-4 w-4 text-accent" />}
        />
        <KpiCard
          label="Contratos"
          value={leah.configured && !leah.error ? String(leah.kpis.contratosMes) : "—"}
          hint="Leah"
          icon={<FileSignature className="h-4 w-4 text-accent" />}
        />
        <KpiCard
          label="Leads hoy"
          value={qara.configured && !qara.error ? String(qara.kpis.nuevosHoy) : "—"}
          hint="Qara"
          icon={<Users className="h-4 w-4 text-accent" />}
        />
        <KpiCard
          label="Alta intención"
          value={qara.configured && !qara.error ? String(qara.kpis.altaIntencion) : "—"}
          hint="Qara"
          icon={<Flame className="h-4 w-4 text-accent" />}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <StatusCard
          title="Leah · QuickBase"
          configured={leah.configured}
          error={leah.error}
          emptyMessage={!leah.configured ? "Configura QUICKBASE_REALM + INTEGRATION_CORE_QUICKBASE_TOKEN" : undefined}
        />
        <StatusCard
          title="Qara · HubSpot"
          configured={qara.configured}
          error={qara.error}
          emptyMessage={!qara.configured ? "Configura INTEGRATION_CORE_HUBSPOT_TOKEN" : undefined}
        />
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  hint,
  icon,
}: {
  label: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardDescription>{label}</CardDescription>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold">{value}</div>
        <p className="text-xs text-muted-foreground mt-1">{hint}</p>
      </CardContent>
    </Card>
  );
}

function StatusCard({
  title,
  configured,
  error,
  emptyMessage,
}: {
  title: string;
  configured: boolean;
  error?: string;
  emptyMessage?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-muted-foreground">
        {!configured && emptyMessage}
        {configured && error && <span className="text-destructive">{error}</span>}
        {configured && !error && <span className="text-success">Conectado — extend mapper in tenants/core/sources/</span>}
      </CardContent>
    </Card>
  );
}
