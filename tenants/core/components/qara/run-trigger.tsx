"use client";

import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Play, ChevronDown, Loader2, User, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { QaraRun } from "@tenants/core/lib/qara-run";

type Channel = "WHATSAPP" | "CALL";

// Ventana para cancelar antes de que Qara se despierte. Disparamos el run REAL solo
// cuando esta cuenta llega a 0; si el usuario cancela antes, no se envía nada (ni
// mensajes ni llamadas). Es un "deshacer" garantizado: la petición a Qara ni siquiera
// sale durante este período.
const CANCEL_WINDOW_S = 5;

// Despierta a Qara desde el UI. "Escanear leads ahora" = scan completo; el formulario
// colapsable corre un solo lead (para pruebas). Al iniciar, entrega el contexto del run
// al padre para que <LiveStatus> muestre el progreso correcto.
export function RunTrigger({ onStarted }: { onStarted: (run: QaraRun) => void }) {
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [channel, setChannel] = useState<Channel>("WHATSAPP");
  // Acción agendada y esperando la ventana de cancelación.
  const [pending, setPending] = useState<{ label: string; seconds: number } | null>(null);
  const fireTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const tickInterval = useRef<ReturnType<typeof setInterval> | null>(null);

  function clearTimers() {
    if (fireTimeout.current) clearTimeout(fireTimeout.current);
    if (tickInterval.current) clearInterval(tickInterval.current);
    fireTimeout.current = null;
    tickInterval.current = null;
  }
  // Limpia timers si el componente se desmonta a mitad de la cuenta.
  useEffect(() => () => clearTimers(), []);

  async function run(
    body: Record<string, unknown>,
    okMsg: string,
    ctx: Omit<QaraRun, "traceId" | "startedAt">
  ) {
    setBusy(true);
    const tid = toast.loading("Despertando a Qara…");
    try {
      const res = await fetch("/api/agents/qara/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || `Error ${res.status}`);
      toast.success(okMsg, { id: tid });
      onStarted({ traceId: data.traceId, startedAt: Date.now(), ...ctx });
    } catch (e) {
      toast.error("No se pudo iniciar", { id: tid, description: e instanceof Error ? e.message : undefined });
    } finally {
      setBusy(false);
    }
  }

  // Agenda el run tras la ventana de cancelación (no lo dispara de inmediato).
  function schedule(
    label: string,
    body: Record<string, unknown>,
    okMsg: string,
    ctx: Omit<QaraRun, "traceId" | "startedAt">
  ) {
    if (pending || busy) return;
    setPending({ label, seconds: CANCEL_WINDOW_S });
    tickInterval.current = setInterval(() => {
      setPending((p) => (p && p.seconds > 1 ? { ...p, seconds: p.seconds - 1 } : p));
    }, 1000);
    fireTimeout.current = setTimeout(() => {
      clearTimers();
      setPending(null);
      run(body, okMsg, ctx);
    }, CANCEL_WINDOW_S * 1000);
  }

  function cancelPending() {
    clearTimers();
    setPending(null);
    toast.info("Cancelado — Qara no se despertó", {
      description: "No se enviaron mensajes ni llamadas.",
    });
  }

  const locked = busy || pending !== null;

  function onScan() {
    schedule(
      "Qara escaneará y contactará los leads nuevos",
      { mode: "scan" },
      "Scan iniciado — Qara está revisando los leads",
      { mode: "scan" }
    );
  }

  function onSingle() {
    if (!contactId.trim()) {
      toast.error("Ingresá un contact ID");
      return;
    }
    schedule(
      channel === "CALL" ? "Qara llamará a este lead" : "Qara le escribirá a este lead",
      { mode: "single", hubspot_contact_id: contactId.trim(), channel },
      channel === "CALL" ? "Llamando al lead…" : "Escribiéndole al lead…",
      { mode: "single", contactId: contactId.trim(), channel }
    );
  }

  return (
    <div className="space-y-3">
      <button
        onClick={onScan}
        disabled={locked}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Escanear leads ahora
      </button>

      {/* Ventana de cancelación: Qara aún NO se ha despertado. */}
      {pending && (
        <div className="flex items-center gap-3 rounded-lg border border-amber-500/40 bg-amber-500/5 px-3 py-2.5 text-sm">
          <Loader2 className="h-4 w-4 shrink-0 animate-spin text-amber-400" />
          <span className="flex-1 text-amber-100">
            {pending.label} en <span className="font-semibold tabular-nums">{pending.seconds}s</span>…
          </span>
          <button
            onClick={cancelPending}
            className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/50 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-100 transition-colors hover:bg-amber-500/20"
          >
            <X className="h-3.5 w-3.5" />
            Cancelar
          </button>
        </div>
      )}

      <div className="rounded-lg border border-border">
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex w-full items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground"
        >
          <User className="h-3.5 w-3.5" />
          Probar con un solo lead
          <ChevronDown className={cn("ml-auto h-4 w-4 transition-transform", open && "rotate-180")} />
        </button>
        {open && (
          <div className="space-y-3 border-t border-border/60 p-3">
            <input
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              placeholder="HubSpot contact ID"
              className="w-full rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm text-foreground"
            />
            <div className="flex items-center gap-2">
              {(["WHATSAPP", "CALL"] as Channel[]).map((c) => (
                <button
                  key={c}
                  onClick={() => setChannel(c)}
                  className={cn(
                    "rounded-lg border px-2.5 py-1 text-xs font-medium transition-colors",
                    channel === c
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
                  )}
                >
                  {c === "WHATSAPP" ? "WhatsApp" : "Llamada"}
                </button>
              ))}
            </div>
            <button
              onClick={onSingle}
              disabled={locked}
              className="inline-flex items-center gap-2 rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-60"
            >
              {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
              Contactar este lead
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
