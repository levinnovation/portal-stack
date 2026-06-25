"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Play, ChevronDown, Loader2, User } from "lucide-react";
import { cn } from "@/lib/utils";

type Channel = "WHATSAPP" | "CALL";

// Despierta a Qara desde el UI. "Escanear leads ahora" = scan completo; el formulario
// colapsable corre un solo lead (para pruebas). Al recibir el trace_id, lo entrega al
// padre para que <LiveStatus> empiece a sondear.
export function RunTrigger({ onStarted }: { onStarted: (traceId: string) => void }) {
  const { toast } = useToast();
  const [busy, setBusy] = useState(false);
  const [open, setOpen] = useState(false);
  const [contactId, setContactId] = useState("");
  const [channel, setChannel] = useState<Channel>("WHATSAPP");

  async function run(body: Record<string, unknown>, okMsg: string) {
    setBusy(true);
    try {
      const res = await fetch("/api/agents/qara/run", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || data.error || `Error ${res.status}`);
      toast({ tone: "success", title: okMsg });
      onStarted(data.traceId);
    } catch (e) {
      toast({
        tone: "error",
        title: "No se pudo iniciar",
        description: e instanceof Error ? e.message : undefined,
      });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        onClick={() => run({ mode: "scan" }, "Scan iniciado — Qara está revisando los leads")}
        disabled={busy}
        className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Escanear leads ahora
      </button>

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
              onClick={() => {
                if (!contactId.trim()) {
                  toast({ tone: "error", title: "Ingresá un contact ID" });
                  return;
                }
                run(
                  { mode: "single", hubspot_contact_id: contactId.trim(), channel },
                  `Procesando el lead ${contactId.trim()}`
                );
              }}
              disabled={busy}
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
