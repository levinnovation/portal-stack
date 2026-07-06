"use client";

/**
 * Segment-grouped lead table for /inteligencia/segmentos.
 * Fetches all leads for the selected time window via /api/agents/inteligencia/leads,
 * groups them client-side by segment, and renders expandable DataTable sections
 * — one accordion section per segment.
 */

import { useState, useEffect } from "react";
import { ChevronDown, ChevronRight, Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
  TempBadge,
  TransitionArrow,
  DirectionChip,
  DaysSinceTouch,
  ConfidenceCell,
  TEMP_CONFIG,
} from "@tenants/core/components/inteligencia/lead-cells";
import { cn } from "@/lib/utils";
import { money, pct } from "@tenants/core/lib/format";
import type { LeadImpact, LeadTemp, SegmentEnriched } from "@tenants/core/sources/inteligencia";

// ── Lead columns ─────────────────────────────────────────────────────────────

const LEAD_COLUMNS: ColumnDef<LeadImpact>[] = [
  {
    key: "name",
    header: "Nombre",
    sortable: true,
    render: (v, r) => (
      <div>
        <div className="font-medium truncate max-w-[150px]" title={r.name}>{r.name}</div>
        {r.email && (
          <div className="text-[10px] text-muted-foreground truncate max-w-[150px]">{r.email}</div>
        )}
      </div>
    ),
  },
  {
    key: "currentTemp",
    header: "Temperatura",
    sortable: true,
    render: (v, r) => (
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
      const transition = r.observedTransition ?? (r.predictedTransition !== "stable" ? r.predictedTransition : null);
      if (!transition) return <DirectionChip direction={r.direction} />;
      const [fromTemp, toTemp] = transition.split("->") as [LeadTemp, LeadTemp];
      return <TransitionArrow from={fromTemp} to={toTemp ?? r.currentTemp} />;
    },
  },
  {
    key: "transitionConfidence",
    header: "Conf.",
    sortable: true,
    align: "right",
    render: (v) => <ConfidenceCell confidence={Number(v)} />,
  },
  {
    key: "daysSinceTouch",
    header: "Sin toque",
    sortable: true,
    align: "right",
    render: (v) => <DaysSinceTouch days={v as number | null} />,
  },
  {
    key: "score",
    header: "Score",
    sortable: true,
    align: "right",
    render: (v) => Number(v).toFixed(0),
  },
  {
    key: "source",
    header: "Fuente",
    sortable: true,
    render: (v) => <span className="truncate max-w-[90px] block text-muted-foreground" title={String(v)}>{String(v)}</span>,
  },
  {
    key: "owner",
    header: "Asesor",
    sortable: true,
    render: (v) => <span className="truncate max-w-[100px] block" title={String(v)}>{String(v) || "—"}</span>,
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
    render: (v) => <span className="truncate max-w-[180px] block text-xs" title={String(v)}>{String(v)}</span>,
  },
];

// ── Segment header ────────────────────────────────────────────────────────────

function SegmentGroupHeader({
  segmentName,
  leads,
  aggregate,
}: {
  segmentName: string;
  leads: LeadImpact[];
  aggregate: SegmentEnriched | undefined;
}) {
  const hot = leads.filter((l) => l.currentTemp === "hot").length;
  const warm = leads.filter((l) => l.currentTemp === "warm").length;
  const cold = leads.filter((l) => l.currentTemp === "cold").length;
  const rar = leads.reduce((s, l) => s + (l.revenueAtRisk ?? 0), 0);

  return (
    <div className="flex flex-wrap items-center gap-3 w-full pr-2">
      <span className="font-semibold text-sm">{segmentName}</span>
      <span className="text-muted-foreground text-xs">{leads.length} leads</span>
      {aggregate && (
        <>
          <span className="text-muted-foreground text-xs">calificación: {pct(aggregate.qualifiedRate)}</span>
          <span className="text-muted-foreground text-xs">score: {aggregate.avgScore.toFixed(1)}</span>
          <span className="text-muted-foreground text-xs">fuente: {aggregate.topSource}</span>
        </>
      )}
      <div className="ml-auto flex items-center gap-1.5">
        {hot > 0 && (
          <Badge className={cn("text-[10px] px-1.5 py-0 border", TEMP_CONFIG.hot.classes)}>
            🔥 {hot}
          </Badge>
        )}
        {warm > 0 && (
          <Badge className={cn("text-[10px] px-1.5 py-0 border", TEMP_CONFIG.warm.classes)}>
            🌡 {warm}
          </Badge>
        )}
        {cold > 0 && (
          <Badge className={cn("text-[10px] px-1.5 py-0 border", TEMP_CONFIG.cold.classes)}>
            ❄ {cold}
          </Badge>
        )}
        {rar > 0 && (
          <span className="text-xs text-rose-300 font-medium">{money(rar)}</span>
        )}
      </div>
    </div>
  );
}

// ── SegmentSection ────────────────────────────────────────────────────────────

function SegmentSection({
  segmentName,
  leads,
  aggregate,
  runType,
}: {
  segmentName: string;
  leads: LeadImpact[];
  aggregate: SegmentEnriched | undefined;
  runType: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="rounded-lg border border-border overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted/40 hover:bg-muted/60 transition-colors text-left"
      >
        {open
          ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
          : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
        }
        <SegmentGroupHeader segmentName={segmentName} leads={leads} aggregate={aggregate} />
      </button>

      {/* Body */}
      {open && (
        <div className="p-3 border-t border-border/60">
          <DataTable
            columns={LEAD_COLUMNS}
            data={leads}
            defaultSort="revenueAtRisk"
            searchKeys={["name", "email", "owner", "source", "campaign"]}
            searchPlaceholder="Buscar lead…"
            csvFilename={`leads-${segmentName}-${runType}.csv`}
            pageSize={20}
            rowKey={(r) => r.id}
            emptyMessage="Sin leads en este segmento."
          />
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

interface SegmentLeadsTableProps {
  runType: string;
  segments: SegmentEnriched[];
}

export function SegmentLeadsTable({ runType, segments }: SegmentLeadsTableProps) {
  const [leads, setLeads] = useState<LeadImpact[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // load function used by retry button (called from user interaction, not effect)
  function load() {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ run_type: runType, limit: "1000" });
    fetch(`/api/agents/inteligencia/leads?${params}`)
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json() as Promise<{ leads?: LeadImpact[] }>;
      })
      .then((json) => { setLeads(json.leads ?? []); setLoading(false); })
      .catch((e) => { setError(e instanceof Error ? e.message : "Error al cargar leads"); setLoading(false); });
  }

  useEffect(() => {
    let active = true;
    const params = new URLSearchParams({ run_type: runType, limit: "1000" });
    void (async () => {
      try {
        const res = await fetch(`/api/agents/inteligencia/leads?${params}`);
        if (!active) return;
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = (await res.json()) as { leads?: LeadImpact[] };
        if (active) { setLeads(json.leads ?? []); setLoading(false); }
      } catch (e) {
        if (active) { setError(e instanceof Error ? e.message : "Error al cargar leads"); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [runType]);

  // Group leads by segment, preserving snapshot segment ordering
  const grouped = leads.reduce<Map<string, LeadImpact[]>>((map, lead) => {
    const seg = lead.segment || "unknown";
    if (!map.has(seg)) map.set(seg, []);
    map.get(seg)!.push(lead);
    return map;
  }, new Map());

  // Sort groups by descending lead count
  const sortedGroups = Array.from(grouped.entries()).sort(([, a], [, b]) => b.length - a.length);

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 py-10 text-muted-foreground text-sm">
        <Loader2 className="h-4 w-4 animate-spin" />
        Cargando leads…
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-400">
        <AlertCircle className="h-4 w-4 shrink-0" />
        <span>{error}</span>
        <button
          type="button"
          onClick={() => void load()}
          className="ml-auto flex items-center gap-1 text-xs hover:text-rose-300"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Reintentar
        </button>
      </div>
    );
  }

  if (sortedGroups.length === 0) {
    return (
      <div className="flex flex-col items-center gap-3 py-10 text-muted-foreground text-sm">
        <p>No hay leads con datos de segmento para este período.</p>
        <p className="text-xs">Ejecuta el ETL para poblar los snapshots de leads con segmentos.</p>
        <button
          type="button"
          onClick={() => void load()}
          className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
        >
          <RefreshCw className="h-3.5 w-3.5" /> Recargar
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between pb-1">
        <span className="text-xs text-muted-foreground">
          {leads.length} leads en {sortedGroups.length} segmentos
        </span>
      </div>
      {sortedGroups.map(([seg, segLeads]) => (
        <SegmentSection
          key={seg}
          segmentName={seg}
          leads={segLeads}
          aggregate={segments.find((s) => s.name === seg)}
          runType={runType}
        />
      ))}
    </div>
  );
}
