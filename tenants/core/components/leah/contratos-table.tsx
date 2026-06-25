"use client";

import { useEffect, useMemo, useState } from "react";
import { ExternalLink, Check, X } from "lucide-react";
import type { Contrato } from "@tenants/core/sources/quickbase";
import { money, dias, fechaCorta } from "@tenants/core/lib/format";
import { cn } from "@/lib/utils";

type SortKey = "fecha" | "monto";

// Tabla de Contratos con filtro por fuente y orden por monto/fecha. Recibe los datos
// ya cargados desde el server component; el filtrado/orden es client-side (no hay tantos
// contratos como para paginar en servidor).
export function ContratosTable({
  contratos,
  portalId,
}: {
  contratos: Contrato[];
  portalId?: string;
}) {
  const [fuente, setFuente] = useState<string>("__all__");
  const [sortKey, setSortKey] = useState<SortKey>("fecha");
  // Render la tabla solo tras montar: los montos/fechas usan Intl ("es-CR"), y el
  // ICU de Node (SSR) puede diferir del browser (espacios CRC/fechas) → hydration
  // mismatch (#418). Difiero el flag fuera del cuerpo del efecto para el linter.
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(id);
  }, []);

  const fuentes = useMemo(
    () => [...new Set(contratos.map((c) => c.firstTouchSource).filter(Boolean))].sort(),
    [contratos]
  );

  const rows = useMemo(() => {
    let r = contratos;
    if (fuente !== "__all__") r = r.filter((c) => c.firstTouchSource === fuente);
    return [...r].sort((a, b) => {
      if (sortKey === "monto") return b.monto - a.monto;
      const ta = a.fechaFirma ? new Date(a.fechaFirma).getTime() : 0;
      const tb = b.fechaFirma ? new Date(b.fechaFirma).getTime() : 0;
      return tb - ta;
    });
  }, [contratos, fuente, sortKey]);

  const dealUrl = (id: string) =>
    portalId && id ? `https://app.hubspot.com/contacts/${portalId}/record/0-3/${id}` : null;

  // Placeholder estable (igual en SSR y primer render del cliente) hasta montar.
  if (!mounted) {
    return (
      <div className="space-y-4">
        <div className="h-9 w-full max-w-md animate-pulse rounded-lg bg-secondary/40" />
        <div className="h-64 w-full animate-pulse rounded-lg bg-secondary/30" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={fuente}
          onChange={(e) => setFuente(e.target.value)}
          className="rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm text-foreground"
          aria-label="Filtrar por fuente"
        >
          <option value="__all__">Todas las fuentes</option>
          {fuentes.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
        </select>

        <div className="inline-flex overflow-hidden rounded-lg border border-border">
          {(["fecha", "monto"] as SortKey[]).map((k) => (
            <button
              key={k}
              onClick={() => setSortKey(k)}
              className={cn(
                "px-3 py-1.5 text-xs font-medium transition-colors",
                sortKey === k
                  ? "bg-accent text-foreground"
                  : "bg-secondary/40 text-muted-foreground hover:text-foreground"
              )}
            >
              Ordenar por {k === "fecha" ? "fecha" : "monto"}
            </button>
          ))}
        </div>

        <span className="ml-auto text-xs text-muted-foreground">{rows.length} contratos</span>
      </div>

      {/* Tabla */}
      <div className="overflow-x-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-secondary/40 text-left text-xs text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-medium">Cliente</th>
              <th className="px-3 py-2 font-medium">Asesor</th>
              <th className="px-3 py-2 font-medium">Fuente</th>
              <th className="px-3 py-2 font-medium">Canal</th>
              <th className="px-3 py-2 text-right font-medium">Monto</th>
              <th className="px-3 py-2 text-right font-medium">Firma</th>
              <th className="px-3 py-2 text-right font-medium">Días</th>
              <th className="px-3 py-2 text-center font-medium">Estado</th>
              <th className="px-3 py-2 text-center font-medium">Deal</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((c) => {
              const url = dealUrl(c.hubspotDealId);
              return (
                <tr key={c.recordId} className="border-t border-border/60 hover:bg-accent/30">
                  <td className="px-3 py-2 font-medium text-foreground">{c.fullName || c.email || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.dealOwner || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.firstTouchSource || "—"}</td>
                  <td className="px-3 py-2 text-muted-foreground">{c.firstTouchChannel || "—"}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-foreground">{money(c.monto)}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{fechaCorta(c.fechaFirma)}</td>
                  <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">{dias(c.daysToClose)}</td>
                  <td className="px-3 py-2">
                    <div className="flex items-center justify-center gap-1.5">
                      <Badge ok={c.leahAttributed} label="Atrib." />
                      <Badge ok={c.hubspotMatched} label="Match" />
                    </div>
                  </td>
                  <td className="px-3 py-2 text-center">
                    {url ? (
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
                      >
                        <ExternalLink className="h-3 w-3" /> ver
                      </a>
                    ) : c.hubspotDealId ? (
                      <span className="font-mono text-[11px] text-muted-foreground">{c.hubspotDealId}</span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Badge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 text-[10px] font-medium",
        ok ? "bg-emerald-500/15 text-emerald-300" : "bg-secondary text-muted-foreground"
      )}
      title={label}
    >
      {ok ? <Check className="h-2.5 w-2.5" /> : <X className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}
