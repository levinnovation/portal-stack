/**
 * Shared time-range presets for agent BI screens (Formalizaciones, Eyal, …)
 * backed by the workers' append-only Postgres snapshot history
 * (`agent_run_snapshots` / `eyal_report_snapshots`). Screens read
 * `?from=&to=` (ISO 8601) from the URL — set either by a preset button or by
 * dragging <TimeRangeSlider>. No "server-only" here: the presets list is also
 * imported by the client-side slider component.
 */
export type TimeRangePreset = "7d" | "30d" | "90d" | "6m" | "1y" | "all";

export const TIME_RANGE_PRESETS: { value: TimeRangePreset; label: string; days: number | null }[] = [
  { value: "7d", label: "7 días", days: 7 },
  { value: "30d", label: "30 días", days: 30 },
  { value: "90d", label: "90 días", days: 90 },
  { value: "6m", label: "6 meses", days: 182 },
  { value: "1y", label: "1 año", days: 365 },
  { value: "all", label: "Todo", days: null },
];

export type ResolvedTimeRange = { from: string | null; to: string | null };

/** Resolve the effective `from`/`to` (ISO strings, or null = unbounded) from
 * raw URL search params, defaulting to `defaultPreset` when neither is set. */
export function resolveTimeRange(
  searchParams: { from?: string | string[]; to?: string | string[]; preset?: string | string[] } | URLSearchParams,
  defaultPreset: TimeRangePreset = "30d",
): ResolvedTimeRange {
  const get = (key: "from" | "to" | "preset"): string | undefined => {
    if (searchParams instanceof URLSearchParams) return searchParams.get(key) ?? undefined;
    const raw = searchParams[key];
    return Array.isArray(raw) ? raw[0] : raw;
  };
  const from = get("from");
  const to = get("to");
  if (from || to) {
    return { from: from ?? null, to: to ?? null };
  }
  // Preset buttons set `?preset=` (and clear from/to) — honor it before
  // falling back to the screen's default.
  const presetValue = (get("preset") as TimeRangePreset | undefined) ?? defaultPreset;
  const preset =
    TIME_RANGE_PRESETS.find((p) => p.value === presetValue) ??
    TIME_RANGE_PRESETS.find((p) => p.value === defaultPreset);
  if (!preset || preset.days === null) return { from: null, to: null };
  const fromDate = new Date(Date.now() - preset.days * 24 * 60 * 60 * 1000);
  return { from: fromDate.toISOString(), to: null };
}
