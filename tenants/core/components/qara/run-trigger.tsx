"use client";

import { useState } from "react";
import { useToast } from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Play, ChevronDown, Loader2, User } from "lucide-react";

type Channel = "WHATSAPP" | "CALL";

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
      <Button onClick={() => run({ mode: "scan" }, "Scan iniciado — Qara está revisando los leads")} disabled={busy}>
        {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
        Escanear leads ahora
      </Button>

      <Collapsible open={open} onOpenChange={setOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" size="sm" className="w-full justify-between px-3 text-muted-foreground">
            <span className="inline-flex items-center gap-2">
              <User className="h-3.5 w-3.5" /> Probar con un solo lead
            </span>
            <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="mt-2 space-y-3 rounded-lg border border-border p-3">
          <Input
            value={contactId}
            onChange={(e) => setContactId(e.target.value)}
            placeholder="HubSpot contact ID"
          />
          <ToggleGroup type="single" value={channel} onValueChange={(v) => v && setChannel(v as Channel)} className="justify-start">
            <ToggleGroupItem value="WHATSAPP" size="sm">WhatsApp</ToggleGroupItem>
            <ToggleGroupItem value="CALL" size="sm">Llamada</ToggleGroupItem>
          </ToggleGroup>
          <Button
            variant="outline"
            size="sm"
            disabled={busy}
            onClick={() => {
              if (!contactId.trim()) {
                toast({ tone: "error", title: "Ingresá un contact ID" });
                return;
              }
              run(
                { mode: "single", hubspot_contact_id: contactId.trim(), channel },
                `Procesando el lead ${contactId.trim()}`,
              );
            }}
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
            Contactar este lead
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
