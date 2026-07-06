"use client";

import { useState } from "react";
import {
  Cell,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";

import { ExternalLink } from "lucide-react";

import { CHART_COLORS, TOOLTIP_STYLE } from "@/components/portal/charts/palette";
import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import { num } from "@tenants/core/lib/format";
import type { PostMetric } from "@tenants/core/sources/inteligencia";

const SOURCE_COLORS: Record<string, string> = {
  FB: "#60a5fa",
  IG: "#e879f9",
};
const FORMAT_ICONS: Record<string, string> = {
  reel: "🎬",
  photo: "📷",
  carousel: "🎠",
  other: "📄",
};

type SortKey = "engagements" | "reach" | "spend" | "ctr" | "engagementRate";
const SORT_OPTIONS: { value: SortKey; label: string }[] = [
  { value: "engagements", label: "Engagements" },
  { value: "reach", label: "Alcance" },
  { value: "spend", label: "Inversión" },
  { value: "ctr", label: "CTR" },
  { value: "engagementRate", label: "Tasa engagement" },
];

function SourceBadge({ source }: { source: string }) {
  const color = SOURCE_COLORS[source] ?? "#a78bfa";
  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
      style={{ background: `${color}22`, color }}
    >
      {source}
    </span>
  );
}

function FormatBadge({ format }: { format: string }) {
  return (
    <span className="inline-flex items-center gap-0.5 rounded-full border border-border bg-secondary/30 px-2 py-0.5 text-[10px] text-muted-foreground">
      {FORMAT_ICONS[format] ?? "📄"} {format}
    </span>
  );
}

type PostRow = PostMetric & { rank: number };

const POST_COLUMNS: ColumnDef<PostRow>[] = [
  { key: "rank", header: "#", sortable: false, align: "right", render: (v) => <span className="text-muted-foreground">{String(v)}</span> },
  {
    key: "adName", header: "Anuncio", sortable: true,
    render: (v, r) => {
      const label = r.adName || r.campaignName || r.adId || "—";
      const url = (r.permalink ?? "").trim();
      if (url) {
        return (
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            title="Abrir publicación pública (IG/FB)"
            className="inline-flex max-w-[160px] items-center gap-1 truncate text-primary underline-offset-2 hover:underline"
          >
            <span className="truncate">{label}</span>
            <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
          </a>
        );
      }
      return (
        <div className="truncate max-w-[160px]" title={label}>
          {label}
        </div>
      );
    },
  },
  {
    key: "source", header: "Fuente", sortable: true,
    render: (v) => <SourceBadge source={String(v)} />,
  },
  {
    key: "format", header: "Formato", sortable: true,
    render: (v) => <FormatBadge format={String(v)} />,
  },
  { key: "engagements", header: "Engagements", align: "right", format: "num", sortable: true },
  { key: "reach", header: "Alcance", align: "right", format: "num", sortable: true },
  { key: "engagementRate", header: "ER", align: "right", format: "pct", sortable: true },
  { key: "spend", header: "Spend", align: "right", format: "money", sortable: true },
  { key: "ctr", header: "CTR", align: "right", format: "pct", sortable: true },
  { key: "cpm", header: "CPM", align: "right", format: "money", sortable: true },
  {
    key: "qualifiedLeads", header: "Leads cal.", align: "right", sortable: true,
    render: (v) => v != null ? num(Number(v)) : <span className="text-muted-foreground">N/D</span>,
  },
];

export function PostRanking({ posts }: { posts: PostMetric[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("engagements");

  const sorted = [...posts].sort((a, b) => b[sortKey] - a[sortKey]);
  const top20 = sorted.slice(0, 20);

  const postTableData: PostRow[] = sorted.map((p, i) => ({ ...p, rank: i + 1 }));

  const scatterData = top20.map((p) => ({
    x: p.reach > 0 ? Math.round((p.spend / p.reach) * 1000) : 0, // CPM-reach proxy
    y: Math.round(p.engagementRate * 10000) / 100,
    z: Math.max(p.engagements, 1),
    name: p.adName || p.adId || p.postId,
    source: p.source,
    format: p.format,
    engagements: p.engagements,
    spend: p.spend,
  }));

  const formatGroups = Array.from(new Set(top20.map((p) => p.format)));

  return (
    <div className="space-y-4">
      {/* Bubble scatter: reach-efficiency vs engagement rate */}
      <div>
        <p className="mb-2 text-xs text-muted-foreground">
          Eje X = CPM efectivo (spend/reach×1000) · Eje Y = tasa de engagement · Tamaño = engagements totales
        </p>
        <ResponsiveContainer width="100%" height={240}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 8 }}>
            <XAxis
              type="number"
              dataKey="x"
              name="CPM efectivo"
              tick={{ fill: "#8b94ac", fontSize: 11 }}
              label={{ value: "CPM", fill: "#8b94ac", fontSize: 10, position: "insideBottomRight", offset: -4 }}
            />
            <YAxis
              type="number"
              dataKey="y"
              name="Engagement rate (%)"
              tick={{ fill: "#8b94ac", fontSize: 11 }}
              label={{ value: "ER%", fill: "#8b94ac", fontSize: 10, angle: -90, position: "insideLeft" }}
            />
            <ZAxis type="number" dataKey="z" range={[40, 600]} />
            <Tooltip
              {...TOOLTIP_STYLE}
              cursor={{ stroke: "#1c2438" }}
              content={({ payload }) => {
                if (!payload?.length) return null;
                const d = payload[0]?.payload as typeof scatterData[0];
                return (
                  <div style={TOOLTIP_STYLE.contentStyle} className="max-w-[200px]">
                    <p className="mb-1 font-semibold leading-tight">{d.name}</p>
                    <p className="text-muted-foreground">
                      {d.source} · {d.format}
                    </p>
                    <p>Engagements: <b>{d.engagements}</b></p>
                    <p>ER: <b>{d.y}%</b></p>
                    <p>CPM: <b>${d.x}</b></p>
                    <p>Spend: <b>${d.spend.toFixed(0)}</b></p>
                  </div>
                );
              }}
            />
            <Scatter data={scatterData} fill="var(--primary)">
              {scatterData.map((entry, i) => (
                <Cell key={i} fill={SOURCE_COLORS[entry.source] ?? CHART_COLORS[i % CHART_COLORS.length]} fillOpacity={0.75} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
        <div className="flex flex-wrap gap-3 text-[11px] text-muted-foreground">
          {Object.entries(SOURCE_COLORS).map(([src, color]) => (
            <span key={src} className="flex items-center gap-1">
              <span className="inline-block h-2.5 w-2.5 rounded-full" style={{ background: color }} />
              {src}
            </span>
          ))}
          {formatGroups.map((fmt) => (
            <span key={fmt} className="flex items-center gap-1">
              {FORMAT_ICONS[fmt] ?? "📄"} {fmt}
            </span>
          ))}
        </div>
      </div>

      {/* Sort control (keeps bubble chart in sync) */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs text-muted-foreground">Ordenar burbuja por:</span>
        {SORT_OPTIONS.map((o) => (
          <button
            key={o.value}
            type="button"
            onClick={() => setSortKey(o.value)}
            className={`rounded-md px-2 py-1 text-xs font-medium transition-colors ${
              o.value === sortKey
                ? "bg-primary text-primary-foreground"
                : "bg-accent text-muted-foreground hover:text-foreground"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={POST_COLUMNS}
        data={postTableData}
        defaultSort="engagements"
        searchKeys={["adName", "campaignName", "source", "format"]}
        searchPlaceholder="Buscar anuncio…"
        csvFilename="meta-posts.csv"
        pageSize={25}
        rowKey={(r) => r.postId || r.adId || String(r.rank)}
      />
    </div>
  );
}
