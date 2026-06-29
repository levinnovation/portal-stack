"use client";

/**
 * Top N leads sorted by revenue at risk — fetches via BFF, renders a DataTable.
 * Used in Comando (all leads) and Equipo (filtered by owner).
 */

import { useState, useEffect } from "react";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
  TempBadge,
  TransitionArrow,
  DirectionChip,
  DaysSinceTouch,
} from "@tenants/core/components/inteligencia/lead-cells";
import { money } from "@tenants/core/lib/format";
import type { LeadImpact, LeadTemp } from "@tenants/core/sources/inteligencia";

const COLUMNS: ColumnDef<LeadImpact>[] = [
  {
    key: "name",
    header: "Nombre",
    sortable: true,
    render: (_, r) => (
      <div>
        <div className="font-medium truncate max-w-[140px]" title={r.name}>{r.name}</div>
        {r.email && <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{r.email}</div>}
      </div>
    ),
  },
  {
    key: "currentTemp",
    header: "Temp",
    sortable: true,
    render: (_, r) => (
      <div className="flex items-center gap-1">
        <TempBadge temp={r.currentTemp} />
        <span className="text-[10px] text-muted-foreground">{r.tempScore.toFixed(0)}</span>
      </div>
    ),
  },
  {
    key: "observedTransition",
    header: "Transición",
    sortable: false,
    render: (_, r) => {
      const t = r.observedTransition ?? (r.predictedTransition !== "stable" ? r.predictedTransition : null);
      if (!t) return <DirectionChip direction={r.direction} />;
      const [from, to] = t.split("->") as [LeadTemp, LeadTemp];
      return <TransitionArrow from={from} to={to ?? r.currentTemp} />;
    },
  },
  {
    key: "daysSinceTouch",
    header: "Sin toque",
    sortable: true,
    align: "right",
    render: (v) => <DaysSinceTouch days={v as number | null} />,
  },
  {
    key: "owner",
    header: "Asesor",
    sortable: true,
    render: (v) => <span className="truncate max-w-[100px] block">{String(v) || "—"}</span>,
  },
  {
    key: "segment",
    header: "Segmento",
    sortable: true,
    render: (v) => <span className="truncate max-w-[100px] block text-muted-foreground">{String(v)}</span>,
  },
  {
    key: "revenueAtRisk",
    header: "Riesgo $",
    sortable: true,
    align: "right",
    render: (v) => <span className="font-medium text-rose-300">{money(Number(v))}</span>,
  },
  {
    key: "nextBestAction",
    header: "Acción",
    sortable: false,
    render: (v) => <span className="truncate max-w-[180px] block text-xs">{String(v)}</span>,
  },
];

interface TopLeadsAtRiskProps {
  runType: string;
  limit?: number;
  owner?: string;
  csvFilename?: string;
}

export function TopLeadsAtRisk({ runType, limit = 25, owner, csvFilename = "leads-riesgo.csv" }: TopLeadsAtRiskProps) {
  const [leads, setLeads] = useState<LeadImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ run_type: runType, limit: String(limit) });
    if (owner) params.set("owner", owner);
    fetch(`/api/agents/inteligencia/leads?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ leads?: LeadImpact[] }>;
      })
      .then((json) => { setLeads(json.leads ?? []); setLoading(false); })
      .catch((e) => { setError(e instanceof Error ? e.message : "Error al cargar"); setLoading(false); });
  }

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ run_type: runType, limit: String(limit) });
    if (owner) params.set("owner", owner);
    void (async () => {
      try {
        const res = await fetch(`/api/agents/inteligencia/leads?${params}`);
        if (!active) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { leads?: LeadImpact[] };
        if (active) { setLeads(json.leads ?? []); setLoading(false); }
      } catch (e) {
        if (active) { setError(e instanceof Error ? e.message : "Error al cargar"); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [runType, limit, owner]);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-8 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando leads…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-3 text-sm text-rose-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
        <button type="button" onClick={() => void load()} className="ml-auto flex items-center gap-1 text-xs hover:text-rose-300">
          <RefreshCw className="h-3.5 w-3.5" /> Reintentar
        </button>
      </div>
    );
  }

  return (
    <DataTable
      columns={COLUMNS}
      data={leads}
      defaultSort="revenueAtRisk"
      searchKeys={["name", "owner", "segment", "source"]}
      searchPlaceholder="Buscar lead…"
      csvFilename={csvFilename}
      pageSize={20}
      rowKey={(r) => r.id}
      emptyMessage="Sin leads con riesgo detectado para este período."
    />
  );
}
