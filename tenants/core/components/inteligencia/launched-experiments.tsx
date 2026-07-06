"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, Rocket, ExternalLink, AlertTriangle } from "lucide-react";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";

type LaunchedItem = {
  campaignId: string;
  name: string;
  launchedAt: string;
  launchedBy: string | number | null;
  status?: string;
  effectiveStatus?: string;
  objective?: string;
  dailyBudget?: string;
  live: boolean;
  error?: string;
};

function statusTone(s?: string): string {
  const v = (s || "").toUpperCase();
  if (v === "ACTIVE") return "bg-emerald-500/15 text-emerald-300 border-emerald-500/30";
  if (v === "PAUSED") return "bg-amber-500/15 text-amber-300 border-amber-500/30";
  return "bg-muted text-muted-foreground border-border/50";
}

export function LaunchedExperiments({ autoRefreshMs = 0 }: { autoRefreshMs?: number }) {
  const [items, setItems] = useState<LaunchedItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inteligencia/experiments/launched?limit=40`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setItems((json.items as LaunchedItem[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron cargar las campañas lanzadas");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    if (autoRefreshMs > 0) {
      const t = setInterval(() => void load(), autoRefreshMs);
      return () => clearInterval(t);
    }
  }, [load, autoRefreshMs]);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
          <Rocket className="h-3.5 w-3.5" /> {items.length} campaña(s) lanzada(s) desde el portal
        </p>
        <button
          type="button"
          onClick={() => void load()}
          disabled={loading}
          className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[11px] text-muted-foreground hover:text-foreground disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
          Actualizar
        </button>
      </div>

      {error ? <p className="text-[11px] text-amber-400">{error}</p> : null}

      {!error && items.length === 0 && !loading ? (
        <p className="text-[11px] text-muted-foreground">
          Aún no hay campañas creadas desde el portal. Usa “Lanzar experimento” en una tarjeta A/B o el Meta Builder.
        </p>
      ) : null}

      <div className="space-y-2">
        {items.map((item) => {
          const active = (item.status || "").toUpperCase() === "ACTIVE";
          return (
            <div
              key={item.campaignId}
              className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-secondary/20 p-2.5"
            >
              <div className="min-w-0">
                <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="truncate">{item.name}</span>
                  {item.live ? (
                    <span className={`rounded-full border px-1.5 py-0.5 text-[10px] ${statusTone(item.status)}`}>
                      {item.status || item.effectiveStatus || "—"}
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-0.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] text-amber-300">
                      <AlertTriangle className="h-2.5 w-2.5" /> sin lectura
                    </span>
                  )}
                </p>
                <p className="text-[11px] text-muted-foreground">
                  {item.objective ? `${item.objective} · ` : ""}
                  {item.dailyBudget ? `budget ${(Number(item.dailyBudget) / 100).toFixed(2)} · ` : ""}
                  {item.launchedBy ? `${item.launchedBy} · ` : ""}
                  {new Date(item.launchedAt).toLocaleDateString()}
                </p>
                {item.error ? <p className="text-[10px] text-amber-400">{item.error}</p> : null}
              </div>
              <div className="flex items-center gap-1.5">
                {active ? (
                  <CommandControl
                    label="Pausar"
                    target="meta"
                    op="pauseCampaign"
                    payload={{ campaignId: item.campaignId }}
                    variant="danger"
                    className="px-2 py-0.5 text-[11px]"
                    description={`Pausar "${item.name}" en Meta`}
                    onSuccess={() => void load()}
                  />
                ) : (
                  <CommandControl
                    label="Activar"
                    target="meta"
                    op="resumeCampaign"
                    payload={{ campaignId: item.campaignId }}
                    className="px-2 py-0.5 text-[11px]"
                    description={`Activar "${item.name}" en Meta`}
                    onSuccess={() => void load()}
                  />
                )}
                <a
                  href={`https://adsmanager.facebook.com/adsmanager/manage/campaigns?selected_campaign_ids=${item.campaignId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-0.5 rounded border border-border px-1.5 py-0.5 text-[11px] text-muted-foreground hover:text-foreground"
                >
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
