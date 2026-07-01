import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export const RUN_TYPE_OPTIONS: { value: InteligenciaRunType; label: string; short: string }[] = [
  { value: "today", label: "Hoy", short: "Hoy" },
  { value: "weekly", label: "Semana actual", short: "Semana" },
  { value: "monthly", label: "Mes actual", short: "Mes" },
  { value: "7d", label: "Últimos 7 días", short: "7d" },
  { value: "1m", label: "Último mes", short: "1m" },
  { value: "3m", label: "Últimos 3 meses", short: "3m" },
  { value: "6m", label: "Últimos 6 meses", short: "6m" },
  { value: "12m", label: "Últimos 12 meses", short: "12m" },
  { value: "full", label: "Histórico completo", short: "Full" },
];

const VALID = new Set<string>(RUN_TYPE_OPTIONS.map((option) => option.value));
export const INTEL_RUN_COOKIE = "intel_run";

export function resolveRun(searchParams?: Record<string, string | string[] | undefined>): InteligenciaRunType {
  const raw = searchParams?.run;
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value && VALID.has(value) ? (value as InteligenciaRunType) : "weekly";
}
