"use client";

import { useCallback, useEffect, useState } from "react";
import { Loader2, RefreshCw, History, AlertTriangle } from "lucide-react";

type HistoryItem = {
  id: string | number;
  action: string;
  entityType?: string;
  entityId?: string;
  createdAt: string;
  destructive: boolean;
  actor: string | number | null;
  payload: unknown;
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.round(diff / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function CommandHistory({ limit = 50, autoRefreshMs = 0 }: { limit?: number; autoRefreshMs?: number }) {
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [open, setOpen] = useState<string | number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/inteligencia/command/history?limit=${limit}`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setItems((json.items as HistoryItem[]) || []);
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo cargar el historial");
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    void load();
    if (autoRefreshMs > 0) {
      const t = setInterval(() => void load(), autoRefreshMs);
      return () => clearInterval(t);
    }
  }, [load, autoRefreshMs]);

  return (
    <div className="space-y-2 rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-center justify-between">
        <p className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <History className="h-3.5 w-3.5" /> Historial de comandos
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
        <p className="text-[11px] text-muted-foreground">Sin comandos ejecutados todavía.</p>
      ) : null}

      <div className="max-h-80 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <div key={item.id} className="rounded border border-border bg-secondary/20 px-2 py-1.5 text-xs">
            <button
              type="button"
              onClick={() => setOpen((o) => (o === item.id ? null : item.id))}
              className="flex w-full items-center justify-between gap-2 text-left"
            >
              <span className="flex items-center gap-1.5 truncate">
                {item.destructive ? <AlertTriangle className="h-3 w-3 shrink-0 text-red-400" /> : null}
                <span className="font-mono font-medium text-foreground">{item.action}</span>
                {item.entityId ? (
                  <span className="truncate text-[10px] text-muted-foreground">· {item.entityId}</span>
                ) : null}
              </span>
              <span className="shrink-0 text-[10px] text-muted-foreground">
                {item.actor ? `${item.actor} · ` : ""}
                {timeAgo(item.createdAt)}
              </span>
            </button>
            {open === item.id ? (
              <pre className="mt-1 max-h-40 overflow-auto rounded bg-background/60 p-2 text-[10px] text-muted-foreground">
                {JSON.stringify(item.payload, null, 2)}
              </pre>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
