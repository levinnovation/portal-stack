"use client";

import { useEffect, useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Clock, Loader2, Save, Info } from "lucide-react";
import { cn } from "@/lib/utils";

type Schedule = { scan_hours: number[]; cleanup_hours: number[]; tz: string };
type GetResp =
  | { available: true; schedule: Schedule }
  | { available: false; reason: string };

const HOURS = Array.from({ length: 24 }, (_, h) => h);
const fmtHour = (h: number) => `${String(h).padStart(2, "0")}:00`;

// Editor de la hora del cron de Qara. Lee/guarda contra el BFF (que proxea a Qara).
// Si el endpoint aún no existe (Track B sin desplegar), muestra "no disponible aún".
export function ScheduleEditor() {
  const { toast } = useToast();
  const [state, setState] = useState<"loading" | "ready" | "unavailable" | "saving">("loading");
  const [reason, setReason] = useState("");
  const [scan, setScan] = useState<number[]>([9, 10]);
  const [cleanup, setCleanup] = useState<number[]>([11]);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/agents/qara/schedule", { cache: "no-store" });
        const data = (await res.json()) as GetResp;
        if (data.available) {
          setScan(data.schedule.scan_hours);
          setCleanup(data.schedule.cleanup_hours);
          setState("ready");
        } else {
          setReason(data.reason);
          setState("unavailable");
        }
      } catch (e) {
        setReason(e instanceof Error ? e.message : "Error al cargar");
        setState("unavailable");
      }
    })();
  }, []);

  function toggle(list: number[], setList: (v: number[]) => void, h: number) {
    setList(list.includes(h) ? list.filter((x) => x !== h) : [...list, h].sort((a, b) => a - b));
  }

  async function save() {
    if (!scan.length) {
      toast({ tone: "error", title: "Elegí al menos una hora de scan" });
      return;
    }
    setState("saving");
    try {
      const res = await fetch("/api/agents/qara/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scan_hours: scan, cleanup_hours: cleanup, tz: "America/Costa_Rica" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || `Error ${res.status}`);
      toast({ tone: "success", title: "Horario guardado", description: "Aplica en el próximo ciclo" });
      setState("ready");
    } catch (e) {
      toast({
        tone: "error",
        title: "No se pudo guardar",
        description: e instanceof Error ? e.message : undefined,
      });
      setState("ready");
    }
  }

  if (state === "loading") {
    return (
      <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
        <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando horario…
      </div>
    );
  }

  if (state === "unavailable") {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-dashed border-border bg-secondary/30 px-3 py-3 text-sm text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <div>
          <div className="font-medium text-foreground">Configuración de horario no disponible todavía</div>
          <div className="mt-0.5 text-xs">{reason}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <HourPicker label="Horas de scan" hint="Cuándo Qara busca y contacta leads nuevos" selected={scan} onToggle={(h) => toggle(scan, setScan, h)} />
      <HourPicker label="Horas de limpieza" hint="Cuándo Qara cierra/depura leads pendientes" selected={cleanup} onToggle={(h) => toggle(cleanup, setCleanup, h)} />

      <div className="flex items-center gap-3">
        <button
          onClick={save}
          disabled={state === "saving"}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {state === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Guardar horario
        </button>
        <span className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" /> Hora de Costa Rica · sin redeploy ni Railway — aplica en el próximo ciclo
        </span>
      </div>
    </div>
  );
}

function HourPicker({
  label,
  hint,
  selected,
  onToggle,
}: {
  label: string;
  hint: string;
  selected: number[];
  onToggle: (h: number) => void;
}) {
  return (
    <div>
      <div className="mb-1.5">
        <span className="text-sm font-medium text-foreground">{label}</span>
        <span className="ml-2 text-xs text-muted-foreground">{hint}</span>
      </div>
      <div className="grid grid-cols-8 gap-1.5 sm:grid-cols-12">
        {HOURS.map((h) => (
          <button
            key={h}
            onClick={() => onToggle(h)}
            className={cn(
              "rounded-md border py-1 text-xs tabular-nums transition-colors",
              selected.includes(h)
                ? "border-primary bg-primary/15 text-primary"
                : "border-border bg-secondary/40 text-muted-foreground hover:text-foreground"
            )}
          >
            {fmtHour(h)}
          </button>
        ))}
      </div>
    </div>
  );
}
