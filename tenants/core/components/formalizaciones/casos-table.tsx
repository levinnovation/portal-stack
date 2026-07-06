"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import type { CaseRow, CaseStatus } from "@tenants/core/sources/formalizaciones";
import { STAGE_LABELS, STATUS_LABELS } from "@tenants/core/lib/formalizaciones-labels";
import { cn } from "@/lib/utils";

const STATUS_BADGE: Record<CaseStatus, string> = {
  ready_for_bank: "bg-emerald-500/15 text-emerald-300",
  contacted: "bg-blue-500/15 text-blue-300",
  escalated: "bg-rose-500/15 text-rose-300",
  throttled: "bg-amber-500/15 text-amber-300",
  pending: "bg-slate-500/15 text-slate-300",
  send_failed: "bg-rose-500/15 text-rose-300",
};

// Tabla de casos de formalización con el link seguro /f/{token} por cliente
// (copiar o abrir). Los datos llegan del server component; filtro client-side.
export function CasosTable({ rows }: { rows: CaseRow[] }) {
  const [statusFilter, setStatusFilter] = useState<string>("__all__");
  const [query, setQuery] = useState("");
  const [copiedUrl, setCopiedUrl] = useState<string>("");

  const filtered = useMemo(() => {
    let r = rows;
    if (statusFilter !== "__all__") r = r.filter((c) => c.status === statusFilter);
    const q = query.trim().toLowerCase();
    if (q) {
      r = r.filter((c) =>
        [c.clientName, c.unitId, c.projectName, c.bankName].some((v) => v.toLowerCase().includes(q))
      );
    }
    return r;
  }, [rows, statusFilter, query]);

  const copyLink = async (url: string) => {
    try {
      await navigator.clipboard.writeText(url);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(""), 2000);
    } catch {
      // clipboard puede fallar sin HTTPS/permisos; el operador aún puede abrir el link
    }
  };

  const presentStatuses = useMemo(() => [...new Set(rows.map((c) => c.status))], [rows]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar cliente, unidad, proyecto o banco…"
          className="w-full max-w-xs rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60"
          aria-label="Buscar caso"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm text-foreground"
          aria-label="Filtrar por estado"
        >
          <option value="__all__">Todos los estados</option>
          {presentStatuses.map((s) => (
            <option key={s} value={s}>
              {STATUS_LABELS[s]}
            </option>
          ))}
        </select>
        <span className="ml-auto text-xs text-muted-foreground">{filtered.length} casos</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Unidad</th>
              <th className="px-3 py-2 font-medium">Proyecto</th>
              <th className="px-3 py-2 font-medium">Banco</th>
              <th className="px-3 py-2 text-center font-medium">Etapa</th>
              <th className="px-3 py-2 text-center font-medium">Estado</th>
              <th className="px-3 py-2 text-right font-medium">Checklist</th>
              <th className="px-3 py-2 font-medium">Docs pendientes</th>
              <th className="px-3 py-2 text-right font-medium">Días silencio</th>
              <th className="px-3 py-2 text-center font-medium">Formulario seguro</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((c, i) => (
              <tr key={`${c.unitId}-${c.clientName}-${i}`} className="border-t border-border/60 hover:bg-accent/30">
                <td className="px-3 py-2 font-medium text-foreground">{c.clientName || "—"}</td>
                <td className="px-3 py-2 font-mono text-xs text-foreground">{c.unitId || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.projectName || "—"}</td>
                <td className="px-3 py-2 text-muted-foreground">{c.bankName || "—"}</td>
                <td className="px-3 py-2 text-center text-xs text-muted-foreground">{STAGE_LABELS[c.stage]}</td>
                <td className="px-3 py-2 text-center">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", STATUS_BADGE[c.status])}>
                    {STATUS_LABELS[c.status]}
                  </span>
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="h-1.5 w-16 overflow-hidden rounded-full bg-secondary">
                      <div
                        className={cn(
                          "h-full rounded-full",
                          c.completenessPct >= 100 ? "bg-emerald-400" : "bg-primary"
                        )}
                        style={{ width: `${c.completenessPct}%` }}
                      />
                    </div>
                    <span className="tabular-nums text-xs text-muted-foreground">{c.completenessPct}%</span>
                  </div>
                </td>
                <td className="max-w-56 px-3 py-2 text-xs text-muted-foreground">
                  {c.missingDocs.length ? c.missingDocs.join(", ") : "—"}
                </td>
                <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{c.silentDays}</td>
                <td className="px-3 py-2">
                  {c.uploadUrl ? (
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => copyLink(c.uploadUrl)}
                        className="inline-flex items-center gap-1 rounded-md border border-border px-2 py-1 text-[11px] text-muted-foreground transition-colors hover:text-foreground"
                        title="Copiar link seguro"
                      >
                        {copiedUrl === c.uploadUrl ? (
                          <>
                            <Check className="h-3 w-3 text-emerald-400" /> copiado
                          </>
                        ) : (
                          <>
                            <Copy className="h-3 w-3" /> copiar
                          </>
                        )}
                      </button>
                      <a
                        href={c.uploadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> abrir
                      </a>
                    </div>
                  ) : (
                    <span className="block text-center text-muted-foreground">—</span>
                  )}
                </td>
              </tr>
            ))}
            {!filtered.length && (
              <tr>
                <td colSpan={10} className="px-3 py-8 text-center text-sm text-muted-foreground">
                  Sin casos que coincidan con el filtro
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
