"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, RefreshCw, AlertTriangle } from "lucide-react";
import { TimeWindowToggle } from "./time-window-toggle";
import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";

const POLL_MS = 3000;

export function EtlControl({ run }: { run: InteligenciaRunType }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [traceId, setTraceId] = useState<string | null>(null);
  const [terminal, setTerminal] = useState<"running" | "success" | "failed" | "unknown">("running");
  const lastStatus = useRef("");

  async function trigger() {
    setBusy(true);
    setTerminal("running");
    try {
      const res = await fetch("/api/agents/inteligencia-13/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "etl", payload: { run_type: run } }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || `Error ${res.status}`);
      setTraceId(String(data.traceId || data.trace_id || data.task_id || ""));
    } catch {
      setBusy(false);
      setTerminal("failed");
    }
  }

  useEffect(() => {
    if (!traceId) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const id = traceId ?? "";
        const res = await fetch(`/api/agents/inteligencia-13/status/${encodeURIComponent(id)}`, { cache: "no-store" });
        if (res.ok) {
          const data = (await res.json()) as { status?: string; terminal?: string };
          const status = (data.terminal || data.status || "unknown") as "running" | "success" | "failed" | "unknown";
          setTerminal(status);
          lastStatus.current = status;
          if (status === "success" || status === "failed") {
            setBusy(false);
            if (status === "success") router.refresh();
            return;
          }
        }
      } catch {
        // keep polling
      }
      if (!stop) timer = setTimeout(tick, POLL_MS);
    }
    void tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [traceId, router]);

  const done = terminal === "success" || terminal === "failed";
  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-muted-foreground">Ventana</span>
        <TimeWindowToggle run={run} />
        <button
          onClick={trigger}
          disabled={busy}
          className="ml-auto inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Actualizar datos
        </button>
      </div>
      {traceId && (
        <div className="flex items-center gap-2 border-t border-border/60 pt-3 text-sm">
          {!done ? (
            <Loader2 className="h-4 w-4 animate-spin text-primary" />
          ) : terminal === "success" ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-rose-400" />
          )}
          <span className="text-foreground">
            {done ? (terminal === "success" ? "Snapshot actualizado" : "El ETL terminó con problemas") : "Ingestando fuentes…"}
          </span>
        </div>
      )}
    </div>
  );
}

