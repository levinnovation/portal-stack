import type { InteligenciaRunType } from "@tenants/core/sources/inteligencia";

export function resolveRun(searchParams?: Record<string, string | string[] | undefined>): InteligenciaRunType {
  const run = searchParams?.run;
  const value = Array.isArray(run) ? run[0] : run;
  return value === "monthly" ? "monthly" : "weekly";
}
