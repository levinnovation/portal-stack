"use client";

import { useEffect, useRef, useState } from "react";
import { RefreshCw, Loader2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const POLL_INTERVAL_MS = 3000;
const POLL_MAX_ATTEMPTS = 30; // ~90s

/**
 * Two-button trigger for a worker agent registered in `externalAgents`
 * (`tenants/core/config.ts`): a side-effect-free "Refresh data" (dry-run /
 * report_snapshot re-read) and a "Run real" action gated behind a
 * confirmation dialog, since it can send real client/staff communication.
 * POSTs directly to the generic `/api/agents/{agentId}/run` proxy
 * (`src/app/api/agents/[agentId]/run/route.ts`) with `async_execution: true`
 * and polls `/status/{traceId}` until terminal, mirroring
 * `tenants/core/components/qara/run-trigger.tsx`.
 */
export function AgentRunTrigger({
  agentId,
  refreshInputs,
  refreshLabel = "Refrescar datos",
  realInputs,
  realLabel = "Ejecutar corrida real",
  confirmTitle = "¿Ejecutar la corrida real?",
  confirmDescription = "Esto puede enviar comunicación real a clientes/equipo y escribir en Quickbase. Esta acción no se puede deshacer.",
  className,
}: {
  agentId: string;
  refreshInputs: Record<string, unknown>;
  refreshLabel?: string;
  realInputs: Record<string, unknown>;
  realLabel?: string;
  confirmTitle?: string;
  confirmDescription?: string;
  className?: string;
}) {
  const [busyKind, setBusyKind] = useState<"refresh" | "real" | null>(null);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => () => {
    if (pollTimer.current) clearTimeout(pollTimer.current);
  }, []);

  async function pollStatus(traceId: string, toastId: string | number, okMsg: string, attempt = 0) {
    if (!traceId || attempt >= POLL_MAX_ATTEMPTS) {
      if (attempt >= POLL_MAX_ATTEMPTS) {
        toast.message("Corrida en curso", {
          id: toastId,
          description: "Sigue ejecutándose en segundo plano; refresca en un momento.",
        });
      }
      return;
    }
    try {
      const res = await fetch(`/api/agents/${agentId}/status/${encodeURIComponent(traceId)}`, { cache: "no-store" });
      const data = await res.json().catch(() => ({}));
      const status = String(data?.status || data?.localStatus || "").toLowerCase();
      if (status === "success" || status === "completed") {
        toast.success(okMsg, { id: toastId });
        return;
      }
      if (status === "failed" || status === "error") {
        toast.error("La corrida terminó con error", { id: toastId, description: String(data?.error || "") });
        return;
      }
    } catch {
      // keep polling — status endpoint may be briefly unavailable
    }
    pollTimer.current = setTimeout(() => pollStatus(traceId, toastId, okMsg, attempt + 1), POLL_INTERVAL_MS);
  }

  async function trigger(kind: "refresh" | "real", inputs: Record<string, unknown>, startMsg: string, okMsg: string) {
    setBusyKind(kind);
    const toastId = toast.loading(startMsg);
    try {
      const res = await fetch(`/api/agents/${agentId}/run`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputs, async_execution: true }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.detail || data?.error || `Error ${res.status}`);
      const traceId = String(data?.traceId || data?.trace_id || data?.task_id || "");
      if (!traceId) {
        toast.success(okMsg, { id: toastId });
      } else {
        toast.loading("Procesando…", { id: toastId });
        pollStatus(traceId, toastId, okMsg);
      }
    } catch (e) {
      toast.error("No se pudo iniciar la corrida", {
        id: toastId,
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusyKind(null);
    }
  }

  const busy = busyKind !== null;

  return (
    <div className={cn("flex flex-wrap items-center gap-2", className)}>
      <button
        type="button"
        onClick={() => trigger("refresh", refreshInputs, "Refrescando datos…", "Datos actualizados")}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-secondary disabled:opacity-60"
      >
        {busyKind === "refresh" ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <RefreshCw className="h-3.5 w-3.5" />
        )}
        {refreshLabel}
      </button>

      <AlertDialog>
        <AlertDialogTrigger asChild>
          <button
            type="button"
            disabled={busy}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
          >
            {busyKind === "real" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <AlertTriangle className="h-3.5 w-3.5" />}
            {realLabel}
          </button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>{confirmDescription}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={() => trigger("real", realInputs, "Iniciando corrida real…", "Corrida real completada")}>
              Sí, ejecutar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
