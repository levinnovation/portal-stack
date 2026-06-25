"use client";

import { useEffect, useRef, useState } from "react";
import { MessageCircle, Phone, CheckCircle2, AlertTriangle, Loader2, Radio } from "lucide-react";
import type { Step } from "@tenants/core/lib/humanize";
import { cn } from "@/lib/utils";

type StatusResp = {
  steps: Step[];
  lastId: string;
  total: number;
  terminal: "running" | "success" | "failed" | "unknown";
  done: boolean;
  summary: string | null;
};

const POLL_MS = 3000;

// Timeline append-only del scan. Sondea el BFF cada ~3s pidiendo solo lo nuevo
// (?since=lastId). Nunca deja un spinner muerto: si el polling falla, reintenta y
// avisa; al terminar muestra la tarjeta resumen.
export function LiveStatus({ traceId }: { traceId: string | null }) {
  const [steps, setSteps] = useState<Step[]>([]);
  const [terminal, setTerminal] = useState<StatusResp["terminal"]>("running");
  const [summary, setSummary] = useState<string | null>(null);
  const [pollError, setPollError] = useState<string | null>(null);
  const lastId = useRef<string>("");
  const seen = useRef<Set<string>>(new Set());

  // El padre remonta este componente con key={traceId} en cada run, así que el estado
  // arranca limpio sin necesidad de resetearlo dentro del efecto.
  useEffect(() => {
    if (!traceId) return;
    let stop = false;
    let timer: ReturnType<typeof setTimeout>;

    async function tick() {
      try {
        const qs = lastId.current ? `?since=${encodeURIComponent(lastId.current)}` : "";
        const res = await fetch(`/api/agents/qara/status/${encodeURIComponent(traceId!)}${qs}`, { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const data = (await res.json()) as StatusResp;
        setPollError(null);

        const fresh = (data.steps ?? []).filter((s) => !seen.current.has(s.id));
        if (fresh.length) {
          fresh.forEach((s) => seen.current.add(s.id));
          setSteps((prev) => [...prev, ...fresh]);
        }
        if (data.lastId) lastId.current = data.lastId;
        setTerminal(data.terminal);
        if (data.done) {
          setSummary(data.summary);
          return; // detiene el polling
        }
      } catch (e) {
        setPollError(e instanceof Error ? e.message : "error de conexión");
      }
      if (!stop) timer = setTimeout(tick, POLL_MS);
    }
    tick();
    return () => {
      stop = true;
      clearTimeout(timer);
    };
  }, [traceId]);

  if (!traceId) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
        <Radio className="h-5 w-5 text-muted-foreground/60" />
        Iniciá un scan para ver el progreso en vivo
      </div>
    );
  }

  const total = steps.find((s) => s.progress)?.progress?.total ?? null;
  const procesados = steps.filter((s) => s.progress).length;
  const done = terminal === "success" || terminal === "failed";

  return (
    <div className="space-y-3">
      {/* Barra de progreso */}
      <div className="flex items-center gap-3">
        {!done ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : terminal === "success" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-rose-400" />
        )}
        <span className="text-sm text-foreground">
          {done
            ? terminal === "success"
              ? "Scan completado"
              : "Scan terminó con problemas"
            : total
              ? `Contactando ${procesados} de ${total}…`
              : "Trabajando…"}
        </span>
        <span className="ml-auto text-xs text-muted-foreground">casi en tiempo real</span>
      </div>

      {pollError && !done && (
        <div className="rounded-md bg-amber-500/10 px-3 py-1.5 text-xs text-amber-300">
          Reintentando… ({pollError})
        </div>
      )}

      {/* Timeline */}
      <ol className="space-y-1.5">
        {steps.map((s) => (
          <li
            key={s.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm",
              s.kind === "error" && "border-rose-500/40 bg-rose-500/5"
            )}
          >
            <StepIcon step={s} />
            <span className={cn("flex-1", s.kind === "error" ? "text-rose-200" : "text-foreground")}>
              {s.text}
            </span>
            {s.progress && (
              <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">
                {s.progress.index}/{s.progress.total}
              </span>
            )}
          </li>
        ))}
        {steps.length === 0 && !done && (
          <li className="rounded-lg border border-dashed border-border px-3 py-3 text-center text-xs text-muted-foreground">
            Esperando los primeros pasos… (Langfuse tarda unos segundos en reflejarlos)
          </li>
        )}
      </ol>

      {/* Resumen terminal */}
      {done && summary && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            terminal === "success"
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-200"
              : "border-rose-500/40 bg-rose-500/5 text-rose-200"
          )}
        >
          <div className="font-medium">{terminal === "success" ? "Listo" : "Terminó con problemas"}</div>
          <div className="mt-0.5 text-xs opacity-90">{summary}</div>
        </div>
      )}
    </div>
  );
}

function StepIcon({ step }: { step: Step }) {
  if (step.kind === "error") return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />;
  if (step.channel === "whatsapp") return <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />;
  if (step.channel === "call") return <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />;
  if (step.kind === "ok") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />;
  return <Radio className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />;
}
