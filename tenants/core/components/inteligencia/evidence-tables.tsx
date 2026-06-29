"use client";

/**
 * Client-side evidence tables for the Inteligencia server pages.
 *
 * WHY THIS FILE EXISTS: DataTable is a Client Component and its column defs use
 * `render`/`rowKey` *functions*. Next.js App Router forbids passing functions
 * from a Server Component to a Client Component, so server pages (Comando,
 * Equipo, Pauta, Segmentos, Diagnostico, Predicciones) cannot build ColumnDefs
 * inline. These thin client wrappers receive only serializable data arrays and
 * define their columns here, where functions are allowed.
 */

import { ExternalLink } from "lucide-react";

import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { cn } from "@/lib/utils";
import { num, pct } from "@tenants/core/lib/format";
import type {
  Kri,
  SegmentEnriched,
  Anomaly,
  ForecastPoint,
  InteligenciaSnapshot,
} from "@tenants/core/sources/inteligencia";

const STATUS_COLORS: Record<string, string> = {
  red: "text-rose-400",
  amber: "text-amber-400",
  green: "text-emerald-400",
};

// ── Comando: KRI detail ──────────────────────────────────────────────────────

type KriRow = Kri & { statusLabel: string };

export function KriTable({ data, run }: { data: Kri[]; run: string }) {
  const rows: KriRow[] = data.map((k) => ({ ...k, statusLabel: k.status }));
  const cols: ColumnDef<KriRow>[] = [
    { key: "name", header: "KRI", sortable: true },
    {
      key: "value",
      header: "Valor",
      align: "right",
      sortable: true,
      render: (v, r) => (
        <span className={cn(STATUS_COLORS[r.status])}>
          {typeof v === "number" && v < 2 ? pct(Number(v)) : num(Number(v))}
        </span>
      ),
    },
    {
      key: "threshold",
      header: "Umbral",
      align: "right",
      sortable: false,
      render: (v) => (typeof v === "number" && v < 2 ? pct(Number(v)) : num(Number(v))),
    },
    {
      key: "statusLabel",
      header: "Estado",
      sortable: true,
      render: (v) => (
        <span className={cn("font-medium capitalize", STATUS_COLORS[String(v)] ?? "text-muted-foreground")}>
          {String(v)}
        </span>
      ),
    },
    { key: "reason", header: "Razón", sortable: false },
  ];
  return (
    <DataTable
      columns={cols}
      data={rows}
      defaultSort="statusLabel"
      csvFilename={`kris-${run}.csv`}
      rowKey={(r) => r.name}
    />
  );
}

// ── Equipo: rep detail ───────────────────────────────────────────────────────

export type RepRow = {
  name: string;
  meetings: number;
  reservations: number;
  showUpRate: number;
  conversion: number;
  avgScore: number;
};

export function RepDetailTable({ data, run }: { data: RepRow[]; run: string }) {
  const cols: ColumnDef<RepRow>[] = [
    { key: "name", header: "Rep", sortable: true },
    { key: "meetings", header: "Citas", align: "right", format: "num", sortable: true },
    { key: "reservations", header: "Reservas", align: "right", format: "num", sortable: true },
    { key: "showUpRate", header: "Show-up", align: "right", format: "pct", sortable: true },
    { key: "conversion", header: "Conversión", align: "right", format: "pct", sortable: true },
    { key: "avgScore", header: "Score prom.", align: "right", sortable: true, render: (v) => Number(v).toFixed(1) },
  ];
  return (
    <DataTable
      columns={cols}
      data={data}
      defaultSort="reservations"
      csvFilename={`equipo-${run}.csv`}
      rowKey={(r) => r.name}
    />
  );
}

// ── Pauta: campaign table ────────────────────────────────────────────────────

const ACTION_COLORS: Record<string, string> = {
  scale: "text-emerald-400",
  pause: "text-rose-400",
  adjust: "text-amber-400",
};
type CampaignRow = InteligenciaSnapshot["campaigns"][number];

/** Meta Ads Manager deep link for a campaign id (resolves the ad account for the
 * logged-in user). Boosted IG/FB posts open at their campaign in Ads Manager. */
function metaCampaignUrl(campaignId?: string): string | null {
  const id = String(campaignId ?? "").trim();
  if (!id) return null;
  return `https://www.facebook.com/adsmanager/manage/ads?selected_campaign_ids=${encodeURIComponent(id)}`;
}

export function CampaignTable({ data, run }: { data: CampaignRow[]; run: string }) {
  const cols: ColumnDef<CampaignRow>[] = [
    {
      key: "name",
      header: "Campaña",
      sortable: true,
      render: (v, r) => {
        const label = String(v);
        const publicUrl = (r.permalink ?? "").trim();
        const url = publicUrl || metaCampaignUrl(r.campaignId);
        if (!url) return label;
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary underline-offset-2 hover:underline"
            title={publicUrl ? "Abrir publicación pública (IG/FB)" : "Abrir en Meta Ads Manager"}
          >
            {label}
            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
          </a>
        );
      },
    },
    { key: "spend", header: "Spend", align: "right", format: "money", sortable: true },
    { key: "qualified", header: "Calificados", align: "right", format: "num", sortable: true },
    { key: "meetings", header: "Citas", align: "right", format: "num", sortable: true },
    { key: "reservations", header: "Reservas", align: "right", format: "num", sortable: true },
    { key: "costPerQualified", header: "CPQL", align: "right", format: "money", sortable: true },
    { key: "costPerReservation", header: "CPR", align: "right", format: "money", sortable: true },
    { key: "ctr", header: "CTR", align: "right", format: "pct", sortable: true },
    { key: "frequency", header: "Freq", align: "right", sortable: true, render: (v) => (v ? Number(v).toFixed(1) : "—") },
    { key: "roas", header: "ROAS", align: "right", sortable: true, render: (v) => (v ? `${Number(v).toFixed(2)}x` : "—") },
    {
      key: "action",
      header: "Acción",
      sortable: true,
      render: (v) => (
        <span className={cn("font-semibold uppercase text-xs", ACTION_COLORS[String(v)] ?? "text-muted-foreground")}>
          {String(v)}
        </span>
      ),
    },
  ];
  return (
    <DataTable
      columns={cols}
      data={data}
      defaultSort="spend"
      searchKeys={["name"]}
      searchPlaceholder="Buscar campaña…"
      csvFilename={`campanas-${run}.csv`}
      rowKey={(r) => r.name}
    />
  );
}

// ── Segmentos: aggregate summary table ───────────────────────────────────────

type SegRow = SegmentEnriched & Record<string, unknown>;

export function SegmentSummaryTable({
  data,
  sourceKeys,
  run,
}: {
  data: SegRow[];
  sourceKeys: string[];
  run: string;
}) {
  const baseCols: ColumnDef<SegRow>[] = [
    { key: "name", header: "Segmento", sortable: true },
    { key: "leads", header: "Leads", align: "right", format: "num", sortable: true },
    { key: "qualified", header: "Calificados", align: "right", format: "num", sortable: true },
    { key: "qualifiedRate", header: "Tasa cal.", align: "right", format: "pct", sortable: true },
    { key: "meetings", header: "Citas", align: "right", format: "num", sortable: true },
    { key: "avgScore", header: "Score prom.", align: "right", sortable: true, render: (v) => Number(v).toFixed(1) },
    { key: "topSource", header: "Fuente top", sortable: true },
  ];
  const srcCols: ColumnDef<SegRow>[] = sourceKeys.map((src) => ({
    key: src,
    header: src,
    align: "right" as const,
    format: "num" as const,
    sortable: true,
  }));
  return (
    <DataTable
      columns={[...baseCols, ...srcCols]}
      data={data}
      defaultSort="leads"
      searchKeys={["name", "topSource"]}
      searchPlaceholder="Buscar segmento…"
      csvFilename={`segmentos-${run}.csv`}
      rowKey={(r) => r.name}
    />
  );
}

// ── Diagnostico: funnel conversion ───────────────────────────────────────────

export type FunnelRow = { stage: string; count: number; stepConversion: string; cumulative: string };

export function FunnelConversionTable({ data, run }: { data: FunnelRow[]; run: string }) {
  const cols: ColumnDef<FunnelRow>[] = [
    { key: "stage", header: "Etapa", sortable: false },
    { key: "count", header: "Volumen", align: "right", format: "num", sortable: true },
    { key: "stepConversion", header: "Conv. paso", align: "right", sortable: false },
    { key: "cumulative", header: "Conv. acumulada", align: "right", sortable: false },
  ];
  return <DataTable columns={cols} data={data} csvFilename={`funnel-${run}.csv`} rowKey={(r) => r.stage} />;
}

// ── Diagnostico: source breakdown ────────────────────────────────────────────

export type SourceRow = { name: string; value: number; share: string };

export function SourceBreakdownTable({ data, run }: { data: SourceRow[]; run: string }) {
  const cols: ColumnDef<SourceRow>[] = [
    { key: "name", header: "Fuente", sortable: true },
    { key: "value", header: "Leads", align: "right", format: "num", sortable: true },
    { key: "share", header: "% total", align: "right", sortable: false },
  ];
  return (
    <DataTable
      columns={cols}
      data={data}
      defaultSort="value"
      searchKeys={["name"]}
      csvFilename={`fuentes-${run}.csv`}
      rowKey={(r) => r.name}
    />
  );
}

// ── Predicciones: anomaly detail ─────────────────────────────────────────────

const SEVERITY_COLORS: Record<string, string> = { high: "text-rose-400", medium: "text-amber-400" };
const DIR_ICONS: Record<string, string> = { up: "↑", down: "↓" };
export type AnomalyRow = Anomaly & { zScoreDisplay: string };

export function AnomalyTable({ data, run }: { data: AnomalyRow[]; run: string }) {
  const cols: ColumnDef<AnomalyRow>[] = [
    { key: "metric", header: "Métrica", sortable: true },
    { key: "date", header: "Fecha", sortable: true, format: "date" },
    { key: "value", header: "Valor", align: "right", format: "num", sortable: true },
    { key: "direction", header: "Dir.", sortable: false, render: (v) => <span>{DIR_ICONS[String(v)] ?? String(v)}</span> },
    {
      key: "severity",
      header: "Severidad",
      sortable: true,
      render: (v) => (
        <span className={cn("font-medium capitalize", SEVERITY_COLORS[String(v)] ?? "text-muted-foreground")}>
          {String(v)}
        </span>
      ),
    },
    { key: "zScoreDisplay", header: "Z-score", align: "right", sortable: false },
  ];
  return (
    <DataTable
      columns={cols}
      data={data}
      defaultSort="date"
      csvFilename={`anomalias-${run}.csv`}
      rowKey={(r) => `${r.metric}-${r.date}`}
    />
  );
}

// ── Predicciones: forecast detail ────────────────────────────────────────────

export type ForecastRow = ForecastPoint & { dateDisplay: string };

export function ForecastTable({ data, run }: { data: ForecastRow[]; run: string }) {
  const cols: ColumnDef<ForecastRow>[] = [
    { key: "date", header: "Fecha", sortable: true, format: "date" },
    { key: "actual", header: "Real", align: "right", sortable: true, render: (v) => (v != null ? num(Number(v)) : "—") },
    { key: "forecast", header: "Forecast", align: "right", sortable: true, render: (v) => (v != null ? num(Number(v)) : "—") },
    { key: "lower", header: "Inferior", align: "right", sortable: false, render: (v) => (v != null ? num(Number(v)) : "—") },
    { key: "upper", header: "Superior", align: "right", sortable: false, render: (v) => (v != null ? num(Number(v)) : "—") },
  ];
  return <DataTable columns={cols} data={data} defaultSort="date" csvFilename={`forecast-${run}.csv`} rowKey={(r) => r.date} />;
}
