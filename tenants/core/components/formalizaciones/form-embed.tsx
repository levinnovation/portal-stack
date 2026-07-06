"use client";

import { useMemo, useState } from "react";
import { ExternalLink } from "lucide-react";
import type { CaseRow } from "@tenants/core/sources/formalizaciones";

// Selector de caso + iframe del formulario seguro de carga (/f/{token}),
// servido y protegido por el worker agent-5: el token va firmado en la URL y
// el cliente (o el operador probando) debe validar la cédula antes de subir.
// No re-implementamos verify/submit aquí — el portal solo lo embebe.
export function FormEmbed({ rows }: { rows: CaseRow[] }) {
  const withForm = useMemo(() => rows.filter((r) => r.uploadUrl), [rows]);
  const [selected, setSelected] = useState<string>(withForm[0]?.uploadUrl ?? "");

  if (!withForm.length) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-border text-sm text-muted-foreground">
        Ningún caso activo tiene link de formulario todavía.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <select
          value={selected}
          onChange={(e) => setSelected(e.target.value)}
          className="w-full max-w-md rounded-lg border border-border bg-secondary/60 px-3 py-1.5 text-sm text-foreground"
          aria-label="Seleccionar caso"
        >
          {withForm.map((c, i) => (
            <option key={`${c.uploadUrl}-${i}`} value={c.uploadUrl}>
              {c.clientName || "Cliente"} · {c.unitId || "unidad"} · {c.projectName || "proyecto"}
            </option>
          ))}
        </select>
        {selected && (
          <a
            href={selected}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
          >
            <ExternalLink className="h-3 w-3" /> abrir en pestaña nueva
          </a>
        )}
      </div>

      {selected && (
        <iframe
          key={selected}
          src={selected}
          title="Formulario seguro de carga de documentos"
          className="h-[70vh] w-full rounded-lg border border-border bg-white"
          sandbox="allow-scripts allow-forms allow-same-origin"
        />
      )}
    </div>
  );
}
