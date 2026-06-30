"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { CommandControl } from "@tenants/core/components/inteligencia/command-control";

type Diagnostics = Record<string, unknown>;

export function ConversionsPanel() {
  const [contactId, setContactId] = useState("");
  const [email, setEmail] = useState("");
  const [value, setValue] = useState("0");
  const [diagnostics, setDiagnostics] = useState<Diagnostics | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadDiagnostics() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/inteligencia/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: "meta", op: "getDiagnostics", payload: {} }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      setDiagnostics((json.result || {}) as Diagnostics);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Diagnostics load failed");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    void loadDiagnostics();
  }, []);

  return (
    <div className="space-y-3 rounded-xl border border-border bg-card/40 p-3">
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Meta Conversions API</p>
        <button
          type="button"
          onClick={() => void loadDiagnostics()}
          className="rounded border border-border px-2 py-1 text-xs hover:bg-secondary/30"
        >
          Refresh diagnostics
        </button>
      </div>
      {error ? <p className="text-xs text-rose-400">{error}</p> : null}
      {busy ? (
        <p className="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 className="h-3 w-3 animate-spin" />
          Loading diagnostics…
        </p>
      ) : null}

      <div className="grid grid-cols-1 gap-2 md:grid-cols-4">
        <input
          value={contactId}
          onChange={(e) => setContactId(e.target.value)}
          placeholder="Contact ID"
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        />
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Value"
          className="rounded border border-border bg-background px-2 py-1 text-xs"
        />
        <CommandControl
          label="Send Lead conversion"
          target="meta"
          op="sendConversion"
          payload={{
            contactId: contactId || "unknown-contact",
            eventName: "Lead",
            businessDay: new Date().toISOString().slice(0, 10),
            userData: { em: email || undefined, external_id: contactId || undefined },
            customData: { value: Number(value || 0), currency: "USD" },
          }}
          className="w-full justify-center"
          description="Enviar evento de conversión offline a Meta"
          onSuccess={() => void loadDiagnostics()}
        />
      </div>
      <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
        <CommandControl
          label="Send test event"
          target="meta"
          op="sendTestEvent"
          payload={{
            eventName: "Lead",
            userData: { em: email || undefined, external_id: contactId || undefined },
            customData: { value: Number(value || 0), currency: "USD" },
          }}
          variant="ghost"
          description="Enviar test event con META_TEST_EVENT_CODE"
          onSuccess={() => void loadDiagnostics()}
        />
      </div>
      {diagnostics ? (
        <pre className="overflow-x-auto rounded border border-border bg-background p-2 text-[11px] text-muted-foreground">
          {JSON.stringify(diagnostics, null, 2)}
        </pre>
      ) : null}
    </div>
  );
}

