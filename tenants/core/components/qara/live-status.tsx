"use client";

import { useEffect, useRef, useState } from "react";
import { Phone, MessageCircle, CheckCircle2, AlertTriangle, Loader2, Radio, Search, X } from "lucide-react";
import type { QaraRun } from "@tenants/core/lib/qara-run";
import { cn } from "@/lib/utils";

type Step = { id: string; text: string; kind: "info" | "ok" | "error" };
type Phase = "running" | "done" | "warn" | "error";

const POLL_MS = 4000;
// La llamada vive en el worker de voz; si el span de outreach tarda, tras unos segundos
// igual mostramos "en la llamada" para que el panel avance.
const CALL_CONNECT_HINT_MS = 15_000;
const CALL_TIMEOUT_MS = 6 * 60_000;
const MSG_TIMEOUT_MS = 60_000;
const SCAN_TIMEOUT_MS = 8 * 60_000;

// Status en vivo basado en LANGFUSE (lo que Qara emite), con HubSpot como red de respaldo:
//  - scan:   spans flow.core_ventas.scan/outreach → "encontró N" + lista de contactados.
//  - single: span outreach (nombre/canal) → "llamando/en la llamada"; el cierre llega por el
//            evento flow.core_ventas.scored (corre en otra traza → se busca por contacto+tiempo),
//            o por HubSpot (OPEN_DEAL/UNQUALIFIED) como respaldo. Siempre llega a estado terminal.
function initialStep(run: QaraRun): Step {
  if (run.mode === "scan")
    return { id: "start", text: "🔍 Qara está revisando y contactando leads nuevos…", kind: "info" };
  if (run.channel === "CALL")
    return { id: "start", text: "📞 Qara está llamando al lead…", kind: "info" };
  return { id: "start", text: "💬 Qara le está escribiendo al lead…", kind: "info" };
}

const channelEs = (c: string) => (c === "CALL" ? "llamada" : c === "WHATSAPP" ? "WhatsApp" : c.toLowerCase());

export function LiveStatus({ run, onClear }: { run: QaraRun | null; onClear?: () => void }) {
  const [steps, setSteps] = useState<Step[]>(() => (run ? [initialStep(run)] : []));
  const [phase, setPhase] = useState<Phase>("running");
  const [summary, setSummary] = useState<string>("");
  const seen = useRef<Set<string>>(new Set(run ? ["start"] : []));

  function pushSteps(next: Step[]) {
    const fresh = next.filter((s) => !seen.current.has(s.id));
    if (!fresh.length) return;
    fresh.forEach((s) => seen.current.add(s.id));
    setSteps((prev) => [...prev, ...fresh]);
  }

  useEffect(() => {
    if (!run) return;
    let stop = false;
    let settled = false;
    let timer: ReturnType<typeof setTimeout>;
    const isCall = run.channel === "CALL";
    const timeoutMs = run.mode === "scan" ? SCAN_TIMEOUT_MS : isCall ? CALL_TIMEOUT_MS : MSG_TIMEOUT_MS;

    function finish(p: Phase, sum: string, step: Step) {
      settled = true;
      pushSteps([step]);
      setSummary(sum);
      setPhase(p);
    }

    // ── Single (llamada / mensaje a un lead) ──────────────────────────────────
    let shownProgress = false;
    let leadName = "";

    function showProgress(name: string) {
      if (shownProgress) return;
      shownProgress = true;
      const n = name || "el lead";
      pushSteps([
        isCall
          ? { id: "incall", text: `🗣️ Qara está en la llamada con ${n}`, kind: "info" }
          : { id: "incall", text: `✍️ Qara le está escribiendo a ${n}`, kind: "info" },
      ]);
    }

    function finishCall(name: string, score: number | null, nextAction: string, outcome: string) {
      const n = name || "el lead";
      const sc = score != null ? ` · puntuó ${score}/10` : "";
      if (outcome === "handoff_whatsapp") {
        finish(
          "done",
          `${n} prefirió seguir por WhatsApp; un asesor continúa la conversación por ahí.${score != null ? ` Qara lo puntuó ${score}/10.` : ""}${nextAction ? ` Próximo paso: ${nextAction}` : ""}`,
          { id: "done", text: `✅ Llamada terminada — ${n}${sc} · sigue por WhatsApp`, kind: "ok" }
        );
        return;
      }
      const low = score != null && score <= 2;
      const sum = low
        ? `Llamada terminada con ${n}. No se concretó la conversación (no contestó, cortó o entró a buzón).${nextAction ? ` Próximo paso: ${nextAction}` : ""}`
        : score != null
          ? `Llamada terminada con ${n}. Qara lo puntuó ${score}/10.${nextAction ? ` Próximo paso: ${nextAction}` : ""}`
          : `Llamada terminada con ${n}.${nextAction ? ` Próximo paso: ${nextAction}` : ""}`;
      finish("done", sum, {
        id: "done",
        text: `✅ Llamada terminada — ${n}${score != null ? ` · puntuó ${score}/10` : ""}`,
        kind: "ok",
      });
    }

    async function tickSingle() {
      try {
        const cid = encodeURIComponent(run!.contactId!);
        const [traceRes, leadRes] = await Promise.all([
          fetch(`/api/agents/qara/trace/${encodeURIComponent(run!.traceId)}?contactId=${cid}&since=${run!.startedAt}`, { cache: "no-store" }),
          fetch(`/api/agents/qara/lead/${cid}`, { cache: "no-store" }),
        ]);

        // Langfuse: span de outreach (nombre/canal) + evento de cierre (scored).
        if (traceRes.ok) {
          const { events, scored } = await traceRes.json();
          const outreach = (events || []).find((e: { kind: string }) => e.kind === "outreach");
          if (outreach) {
            leadName = outreach.leadName || leadName;
            if (!isCall) {
              finish("done", `Mensaje enviado a ${leadName || "el lead"}. La respuesta y la puntuación llegarán cuando conteste.`, {
                id: "done", text: `✅ Mensaje enviado a ${leadName || "el lead"}`, kind: "ok",
              });
              return;
            }
            showProgress(leadName);
          }
          if (isCall && scored) {
            finishCall(scored.leadName || leadName, scored.score, scored.nextAction, scored.outcome);
            return;
          }
        }

        // HubSpot: nombre + respaldo de cierre (por si Langfuse tarda en ingerir).
        if (leadRes.ok) {
          const lead = await leadRes.json();
          leadName = leadName || lead.name || "";
          const lm = lead.lastModifiedMs || 0;
          const touched = lm > run!.startedAt;
          if (!isCall && touched && lead.outreachMessage) {
            finish("done", `Mensaje enviado a ${leadName || "el lead"}. La respuesta y la puntuación llegarán cuando conteste.`, {
              id: "done", text: `✅ Mensaje enviado a ${leadName || "el lead"}`, kind: "ok",
            });
            return;
          }
          if (isCall) {
            if (touched) showProgress(leadName);
            // Estado terminal limpio en HubSpot (el handoff lo cubre el evento scored de Langfuse).
            if (touched && (lead.leadStatus === "OPEN_DEAL" || lead.leadStatus === "UNQUALIFIED")) {
              finishCall(leadName, lead.score, lead.nextAction, "scored");
              return;
            }
          }
        }

        // Respaldo de tiempo: si la llamada ya lleva unos segundos, mostrá "en la llamada".
        if (isCall && Date.now() - run!.startedAt >= CALL_CONNECT_HINT_MS) showProgress(leadName);
      } catch {
        /* reintenta */
      }
      if (!stop && !settled) timer = setTimeout(tickSingle, POLL_MS);
    }

    // ── Scan (lote de leads) ──────────────────────────────────────────────────
    function tickScan() {
      Promise.all([
        fetch(`/api/agents/qara/trace/${encodeURIComponent(run!.traceId)}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
        fetch(`/api/agents/qara/run/${encodeURIComponent(run!.traceId)}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null),
      ]).then(([trace, job]) => {
        if (trace?.events) {
          const scan = trace.events.find((e: { kind: string }) => e.kind === "scan");
          if (scan) {
            pushSteps([{
              id: "scan",
              text: scan.total != null ? `🔍 Qara encontró ${scan.total} lead${scan.total === 1 ? "" : "s"} y los está contactando` : "🔍 Qara está revisando leads…",
              kind: "info",
            }]);
          }
          for (const ev of trace.events.filter((e: { kind: string }) => e.kind === "outreach")) {
            const prog = ev.index != null && ev.total != null ? ` (${ev.index}/${ev.total})` : "";
            const via = ev.channel ? ` · ${channelEs(ev.channel)}` : "";
            pushSteps([{ id: `o-${ev.contactId || ev.at}`, text: `→ Contactó a ${ev.leadName || "un lead"}${via}${prog}`, kind: "info" }]);
          }
        }
        if (job?.status === "success") {
          const r = job.result || {};
          const proc = r.processed ?? 0;
          const scanned = r.scanned ?? 0;
          finish("done", `Listo — Qara contactó ${proc} de ${scanned} lead${scanned === 1 ? "" : "s"} nuevos.`, {
            id: "done", text: `✅ Scan completado — ${proc}/${scanned} contactados`, kind: "ok",
          });
          return;
        }
        if (job?.status === "failed") {
          finish("error", "El scan terminó con un problema. Revisá los logs de Qara.", { id: "fail", text: "⚠️ El scan terminó con un problema", kind: "error" });
          return;
        }
        if (!stop && !settled) timer = setTimeout(tickScan, POLL_MS);
      });
    }

    const tick = run.mode === "scan" ? tickScan : tickSingle;
    timer = setTimeout(tick, 1500);

    const hardStop = setTimeout(() => {
      if (settled) return;
      stop = true;
      clearTimeout(timer);
      setSummary(
        isCall
          ? "La llamada sigue en curso o tardó más de lo normal. El resultado quedará en HubSpot al terminar."
          : run!.mode === "scan"
            ? "El scan está tardando más de lo normal. Revisá los resultados en la pestaña Analítica."
            : "El envío está tardando más de lo normal. Revisá el lead en HubSpot."
      );
      setPhase("warn");
    }, timeoutMs);

    return () => {
      stop = true;
      clearTimeout(timer);
      clearTimeout(hardStop);
    };
  }, [run]);

  if (!run) {
    return (
      <div className="flex h-32 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-border text-center text-sm text-muted-foreground">
        <Radio className="h-5 w-5 text-muted-foreground/60" />
        Iniciá un scan o una acción para ver el progreso en vivo
      </div>
    );
  }

  const done = phase !== "running";

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        {phase === "running" ? (
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
        ) : phase === "done" ? (
          <CheckCircle2 className="h-4 w-4 text-emerald-400" />
        ) : (
          <AlertTriangle className={cn("h-4 w-4", phase === "error" ? "text-rose-400" : "text-amber-400")} />
        )}
        <span className="text-sm text-foreground">
          {phase === "running" ? "Trabajando…" : phase === "done" ? "Completado" : "Atención"}
        </span>
        {done && onClear ? (
          <button
            onClick={onClear}
            className="ml-auto inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-secondary/60 hover:text-foreground"
          >
            <X className="h-3.5 w-3.5" />
            Limpiar
          </button>
        ) : (
          <span className="ml-auto text-xs text-muted-foreground">casi en tiempo real</span>
        )}
      </div>

      <ol className="space-y-1.5">
        {steps.map((s) => (
          <li
            key={s.id}
            className={cn(
              "flex items-start gap-2.5 rounded-lg border border-border/60 bg-card/40 px-3 py-2 text-sm",
              s.kind === "error" && "border-rose-500/40 bg-rose-500/5"
            )}
          >
            <StepIcon kind={s.kind} mode={run.mode} channel={run.channel} />
            <span className={cn("flex-1", s.kind === "error" ? "text-rose-200" : "text-foreground")}>{s.text}</span>
          </li>
        ))}
      </ol>

      {done && summary && (
        <div
          className={cn(
            "rounded-lg border px-4 py-3 text-sm",
            phase === "done"
              ? "border-emerald-500/40 bg-emerald-500/5 text-emerald-200"
              : phase === "error"
                ? "border-rose-500/40 bg-rose-500/5 text-rose-200"
                : "border-amber-500/40 bg-amber-500/5 text-amber-200"
          )}
        >
          <div className="font-medium">
            {phase === "done" ? "Listo" : phase === "error" ? "Terminó con problemas" : "Sigue en curso"}
          </div>
          <div className="mt-0.5 text-xs opacity-90">{summary}</div>
        </div>
      )}
    </div>
  );
}

function StepIcon({ kind, mode, channel }: { kind: Step["kind"]; mode: string; channel?: string }) {
  if (kind === "error") return <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-rose-400" />;
  if (kind === "ok") return <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />;
  if (mode === "scan") return <Search className="mt-0.5 h-4 w-4 shrink-0 text-primary" />;
  if (channel === "CALL") return <Phone className="mt-0.5 h-4 w-4 shrink-0 text-sky-400" />;
  return <MessageCircle className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />;
}
