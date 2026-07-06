import type { EyalWindow } from "@tenants/core/sources/eyal";

export const EYAL_WINDOW_OPTIONS: { value: EyalWindow; label: string; short: string }[] = [
  { value: "1w", label: "Última semana", short: "1S" },
  { value: "1m", label: "Último mes", short: "1M" },
  { value: "3m", label: "Últimos 3 meses", short: "3M" },
  { value: "6m", label: "Últimos 6 meses", short: "6M" },
  { value: "1y", label: "Último año", short: "1A" },
  { value: "full", label: "Todo", short: "Todo" },
];

const VALID = new Set(EYAL_WINDOW_OPTIONS.map((o) => o.value));

export function resolveEyalWindow(raw: unknown, fallback: EyalWindow = "1m"): EyalWindow {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return typeof value === "string" && VALID.has(value as EyalWindow) ? (value as EyalWindow) : fallback;
}
