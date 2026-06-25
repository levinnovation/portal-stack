// Formateadores compartidos — locale es-CR (Costa Rica). CORE vende en colones,
// pero los montos de Quickbase pueden venir en CRC o USD según la config del cliente;
// `money()` asume CRC por defecto y acepta override de moneda.

export function money(n: number | string | null | undefined, currency = "CRC"): string {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  if (!isFinite(v as number)) return currency === "CRC" ? "₡0" : "$0";
  return (v as number).toLocaleString("es-CR", {
    style: "currency",
    currency,
    maximumFractionDigits: currency === "CRC" ? 0 : 2,
  });
}

export function compactMoney(n: number | string | null | undefined, currency = "CRC"): string {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  if (!isFinite(v as number)) return currency === "CRC" ? "₡0" : "$0";
  return (v as number).toLocaleString("es-CR", {
    style: "currency",
    currency,
    notation: "compact",
    maximumFractionDigits: 1,
  });
}

export function num(n: number | string | null | undefined): string {
  const v = typeof n === "string" ? parseFloat(n) : n ?? 0;
  return (v as number).toLocaleString("es-CR");
}

/** Recibe una tasa 0–1 y la muestra como porcentaje (ej. 0.23 → "23.0%"). */
export function pct(n: number | null | undefined, digits = 1): string {
  const v = n ?? 0;
  return `${(v * 100).toFixed(digits)}%`;
}

/** Delta relativo con signo, para KPIs (ej. 0.12 → "+12.0%"). */
export function delta(n: number | null | undefined, digits = 1): string {
  const v = n ?? 0;
  const sign = v > 0 ? "+" : "";
  return `${sign}${(v * 100).toFixed(digits)}%`;
}

export function fechaCorta(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CR", { day: "2-digit", month: "short", year: "numeric" });
}

export function fechaLarga(d: string | Date | null | undefined): string {
  if (!d) return "—";
  const date = typeof d === "string" ? new Date(d) : d;
  if (isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("es-CR", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Días (entero) → "12 días" / "1 día" / "—". */
export function dias(n: number | null | undefined): string {
  if (n === null || n === undefined || !isFinite(n)) return "—";
  const r = Math.round(n);
  return `${r} ${r === 1 ? "día" : "días"}`;
}
