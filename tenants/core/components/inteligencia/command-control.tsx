"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type CommandControlProps = {
  label: string;
  target: string;
  op: string;
  payload: Record<string, unknown>;
  variant?: "default" | "danger" | "ghost";
  destructive?: boolean;
  description?: string;
  className?: string;
  onSuccess?: (result: unknown) => void;
  /** When true, renders a small inline result/debug output under the button after success. */
  showResult?: boolean;
};

function buttonTone(variant: CommandControlProps["variant"], destructive?: boolean): string {
  if (destructive || variant === "danger") {
    return "border border-rose-500/40 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20";
  }
  if (variant === "ghost") {
    return "border border-border bg-secondary/30 text-foreground hover:bg-secondary/50";
  }
  return "border border-emerald-500/40 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20";
}

export function CommandControl({
  label,
  target,
  op,
  payload,
  variant = "default",
  destructive = false,
  description,
  className = "",
  onSuccess,
  showResult = false,
}: CommandControlProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [confirmText, setConfirmText] = useState("");
  const signature = useMemo(() => `${target}.${op}`, [target, op]);
  const needsTypedConfirm = destructive;
  const confirmOk = !needsTypedConfirm || confirmText === "CONFIRM";

  async function run() {
    if (!confirmOk) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/inteligencia/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target, op, payload }),
      });
      const json = (await res.json()) as { result?: unknown; detail?: string; error?: string };
      if (!res.ok) throw new Error(json.detail || json.error || `HTTP ${res.status}`);
      if (showResult) setResult(json.result ?? { ok: true });
      onSuccess?.(json.result);
      setOpen(false);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Command failed");
    } finally {
      setBusy(false);
    }
  }

  const dialog = (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          className={`inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium transition ${buttonTone(variant, destructive)} ${className}`}
        >
          <Play className="h-3 w-3" />
          {label}
        </button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar acción</DialogTitle>
          <DialogDescription>{description || `Se ejecutará ${signature} en sistemas externos.`}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="rounded border border-border bg-secondary/30 p-2 text-xs">
            <div className="font-semibold text-foreground">{signature}</div>
            <pre className="mt-1 max-h-48 overflow-auto whitespace-pre-wrap break-words text-[11px] text-muted-foreground">{JSON.stringify(payload, null, 2)}</pre>
          </div>
          {needsTypedConfirm && (
            <label className="block text-xs text-muted-foreground">
              Escribe <span className="font-semibold text-foreground">CONFIRM</span> para continuar.
              <input
                className="mt-1 w-full rounded border border-border bg-background px-2 py-1 text-xs text-foreground"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
              />
            </label>
          )}
          {error && (
            <div className="flex items-start gap-2 rounded border border-rose-500/40 bg-rose-500/10 p-2 text-xs text-rose-300">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              <span className="min-w-0 break-words">{error}</span>
            </div>
          )}
        </div>
        <DialogFooter>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="rounded border border-border px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={busy || !confirmOk}
            onClick={() => void run()}
            className="inline-flex items-center gap-2 rounded bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
            Ejecutar
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );

  if (!showResult) return dialog;
  return (
    <div className="space-y-1">
      {dialog}
      {result != null ? (
        <pre className="max-w-full overflow-x-auto rounded border border-emerald-500/30 bg-emerald-500/5 p-1.5 text-[10px] leading-tight text-emerald-200/90">
          {(() => {
            const r = result as Record<string, unknown>;
            const id = r?.id ?? (r?.result as Record<string, unknown>)?.id;
            const head = id ? `✓ id ${String(id)} · ` : "✓ ";
            return head + JSON.stringify(result).slice(0, 220);
          })()}
        </pre>
      ) : null}
    </div>
  );
}

