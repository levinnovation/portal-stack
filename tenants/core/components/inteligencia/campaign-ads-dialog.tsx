"use client";

import { useCallback, useEffect, useState } from "react";
import { AlertCircle, ExternalLink, Loader2, RefreshCw } from "lucide-react";

import { DataTable, type ColumnDef } from "@/components/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FormatBadge } from "@tenants/core/components/inteligencia/format-badge";
import { formatLabel } from "@tenants/core/lib/ad-formats";
import { money, num } from "@tenants/core/lib/format";
import type { PostMetric } from "@tenants/core/sources/inteligencia";

type CampaignAdsDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  run: string;
  campaignId?: string;
  campaignName: string;
  /** Campaign-level display format (rollup) — shown in the header, distinct from ad rows. */
  campaignDisplayFormat?: string | null;
};

type PostRow = PostMetric & { formato: string };

const SOURCE_COLORS: Record<string, string> = {
  FB: "#60a5fa",
  IG: "#e879f9",
};

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

function metaAdUrl(adId?: string): string | null {
  const id = String(adId ?? "").trim();
  if (!id) return null;
  return `https://www.facebook.com/adsmanager/manage/ads?selected_ad_ids=${encodeURIComponent(id)}`;
}

const COLUMNS: ColumnDef<PostRow>[] = [
  {
    key: "adName",
    header: "Anuncio / post",
    sortable: true,
    render: (v, r) => {
      const label = String(v || r.campaignName || r.adId || "—");
      const publicUrl = (r.permalink ?? "").trim();
      const url = publicUrl || metaAdUrl(r.adId);
      if (!url) {
        return (
          <div className="max-w-[180px] truncate" title={label}>
            {label}
          </div>
        );
      }
      return (
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          title={publicUrl ? "Abrir publicación pública (IG/FB)" : "Abrir en Meta Ads Manager"}
          className="inline-flex max-w-[180px] items-center gap-1 truncate text-primary underline-offset-2 hover:underline"
        >
          <span className="truncate">{label}</span>
          <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
        </a>
      );
    },
  },
  {
    key: "formato",
    header: "Formato",
    sortable: true,
    render: (_v, r) => <FormatBadge format={r.format} />,
  },
  {
    key: "source",
    header: "Canal",
    sortable: true,
    render: (v) => <SourceBadge source={String(v)} />,
  },
  { key: "spend", header: "Spend", align: "right", format: "money", sortable: true },
  { key: "reach", header: "Alcance", align: "right", format: "num", sortable: true },
  { key: "engagements", header: "Engagements", align: "right", format: "num", sortable: true },
  { key: "ctr", header: "CTR", align: "right", format: "pct", sortable: true },
];

/**
 * Lazy campaign-scoped ad/post drill-down. Fetches via BFF only when opened.
 * Values in the table are ad/post grain — not campaign aggregates.
 */
export function CampaignAdsDialog({
  open,
  onOpenChange,
  run,
  campaignId,
  campaignName,
  campaignDisplayFormat,
}: CampaignAdsDialogProps) {
  const [posts, setPosts] = useState<PostMetric[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        run_type: run,
        limit: "100",
      });
      if (campaignId) params.set("campaign_id", campaignId);
      if (campaignName) params.set("campaign_name", campaignName);
      const res = await fetch(`/api/agents/inteligencia/posts?${params}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(
          typeof body?.error === "string" ? body.error : `HTTP ${res.status}`,
        );
      }
      const json = (await res.json()) as { posts?: PostMetric[] };
      setPosts(json.posts ?? []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al cargar anuncios");
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }, [run, campaignId, campaignName]);

  useEffect(() => {
    if (open) void load();
  }, [open, load]);

  const rows: PostRow[] = posts.map((p) => ({
    ...p,
    formato: formatLabel(p.format),
  }));

  const totalSpend = posts.reduce((s, p) => s + (p.spend || 0), 0);
  const totalEng = posts.reduce((s, p) => s + (p.engagements || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[90vh] max-w-4xl flex-col">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold leading-tight">
            Anuncios · {campaignName}
          </DialogTitle>
          <DialogDescription className="mt-1 space-y-1 text-xs">
            <span className="block">
              Formatos a nivel anuncio/post (no agregados de campaña).
              {campaignDisplayFormat ? (
                <>
                  {" "}
                  Rollup campaña:{" "}
                  <FormatBadge format={campaignDisplayFormat} className="align-middle" />
                </>
              ) : null}
            </span>
            {!loading && !error && posts.length > 0 ? (
              <span className="block text-muted-foreground">
                {num(posts.length)} creatividades · spend ads {money(totalSpend)} · engagements{" "}
                {num(totalEng)}
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Cargando anuncios…
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-3 py-12 text-center">
            <AlertCircle className="h-8 w-8 text-rose-400" />
            <p className="text-sm text-muted-foreground">{error}</p>
            <button
              type="button"
              onClick={() => void load()}
              className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs hover:bg-accent"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Reintentar
            </button>
          </div>
        ) : rows.length === 0 ? (
          <div className="py-12 text-center text-sm text-muted-foreground">
            Sin anuncios/posts para esta campaña en la ventana seleccionada.
            {campaignId ? null : (
              <span className="mt-1 block text-xs">
                (Sin campaignId — el filtro por nombre puede no coincidir hasta el backfill de Agent 13.)
              </span>
            )}
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-auto">
            <DataTable
              columns={COLUMNS}
              data={rows}
              defaultSort="spend"
              searchKeys={["adName", "campaignName", "source", "formato", "format"]}
              searchPlaceholder="Buscar anuncio…"
              csvFilename={`anuncios-${campaignName.replace(/\s+/g, "-").slice(0, 40)}-${run}.csv`}
              pageSize={25}
              rowKey={(r) => r.postId || r.adId || r.id || `${r.adName}-${r.source}`}
            />
            <p className="mt-2 text-[10px] text-muted-foreground">
              Métricas a grano anuncio/post (spend, reach, engagements, CTR). El rollup Mixto de la
              campaña se calcula aparte con shares ponderadas por spend.
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
