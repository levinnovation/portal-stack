import type { InteligenciaRunType, InteligenciaSnapshot } from "@tenants/core/sources/inteligencia";
import { getInteligenciaData } from "@tenants/core/sources/inteligencia";
import { errMsg } from "@tenants/core/lib/errors";

export function resolveRun(searchParams?: Record<string, string | string[] | undefined>): InteligenciaRunType {
  const run = searchParams?.run;
  const value = Array.isArray(run) ? run[0] : run;
  return value === "monthly" ? "monthly" : "weekly";
}

export type InteligenciaLoadResult =
  | { ok: true; data: InteligenciaSnapshot }
  | { ok: false; error: string };

/** Degrada fetch/config errors to ErrorState — never throw into the segment error boundary. */
export async function loadInteligencia(run: InteligenciaRunType): Promise<InteligenciaLoadResult> {
  try {
    return { ok: true, data: await getInteligenciaData(run) };
  } catch (e) {
    return { ok: false, error: errMsg(e) };
  }
}
