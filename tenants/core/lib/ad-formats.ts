/**
 * Meta ad creative format labels, Mixto rollup rules, and snake/camel normalization.
 * Pure helpers — safe for client components and self-checks (no server-only).
 */

export const AD_FORMATS = [
  "reel",
  "video",
  "photo",
  "carousel",
  "story",
  "dynamic",
  "other",
] as const;

export type AdFormat = (typeof AD_FORMATS)[number];

/** Campaign rollup display: a concrete format or Mixto. */
export type DisplayFormat = AdFormat | "mixed";

/** Second-largest format share of weighted delivery must be ≥ this → Mixto. */
export const MIXED_FORMAT_THRESHOLD = 0.2;

export const FORMAT_LABELS: Record<DisplayFormat, string> = {
  reel: "Reel",
  video: "Video",
  photo: "Foto",
  carousel: "Carrusel",
  story: "Historia",
  dynamic: "Dinámico",
  other: "Otro",
  mixed: "Mixto",
};

export const FORMAT_ICONS: Record<DisplayFormat, string> = {
  reel: "🎬",
  video: "📹",
  photo: "📷",
  carousel: "🎠",
  story: "📱",
  dynamic: "✨",
  other: "📄",
  mixed: "🔀",
};

const FORMAT_SET = new Set<string>(AD_FORMATS);

export function isAdFormat(value: unknown): value is AdFormat {
  return typeof value === "string" && FORMAT_SET.has(value);
}

export function normalizeAdFormat(raw: unknown): AdFormat | undefined {
  if (raw == null || raw === "") return undefined;
  const v = String(raw).trim().toLowerCase();
  if (v === "mixed" || v === "mixto") return undefined;
  if (isAdFormat(v)) return v;
  // Common aliases from Meta / legacy payloads
  if (v === "image" || v === "foto") return "photo";
  if (v === "videos") return "video";
  if (v === "reels") return "reel";
  if (v === "stories" || v === "historia") return "story";
  if (v === "carrusel" || v === "carousel_album") return "carousel";
  if (v === "dinamico" || v === "dinámico") return "dynamic";
  return "other";
}

export function normalizeDisplayFormat(
  raw: unknown,
  primaryFallback?: AdFormat | undefined,
): DisplayFormat | undefined {
  if (raw == null || raw === "") {
    return primaryFallback;
  }
  const v = String(raw).trim().toLowerCase();
  if (v === "mixed" || v === "mixto") return "mixed";
  return normalizeAdFormat(v) ?? primaryFallback;
}

/**
 * Normalize format_mix shares to ~0..1. Accepts camel/snake maps and
 * percentage values (>1 treated as percent points).
 */
export function normalizeFormatMix(raw: unknown): Record<AdFormat, number> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Partial<Record<AdFormat, number>> = {};
  let max = 0;
  for (const [key, val] of Object.entries(raw as Record<string, unknown>)) {
    const fmt = normalizeAdFormat(key);
    if (!fmt) continue;
    const n = Number(val);
    if (!Number.isFinite(n) || n < 0) continue;
    out[fmt] = (out[fmt] ?? 0) + n;
    max = Math.max(max, out[fmt]!);
  }
  const keys = Object.keys(out) as AdFormat[];
  if (!keys.length) return undefined;
  // If any share looks like a percent (e.g. 45), scale down.
  const scale = max > 1.0001 ? 100 : 1;
  const normalized = {} as Record<AdFormat, number>;
  for (const k of keys) {
    normalized[k] = (out[k] ?? 0) / scale;
  }
  return normalized;
}

export function formatLabel(format: string | null | undefined): string {
  if (format == null || format === "") return "—";
  const v = String(format).trim().toLowerCase();
  if (v === "mixed" || v === "mixto") return FORMAT_LABELS.mixed;
  const normalized = normalizeAdFormat(v);
  if (normalized) return FORMAT_LABELS[normalized];
  return "—";
}

/** Human-readable Mixto / rollup formula for tooltips and glossary. */
export const FORMAT_MIX_FORMULA =
  "Shares ponderadas por spend (fallback: impresiones → nº de creatividades). Mixto cuando el 2º formato ≥ 20% del delivery ponderado.";

export function formatMixTooltip(mix?: Record<string, number> | null): string {
  if (!mix || !Object.keys(mix).length) return FORMAT_MIX_FORMULA;
  const shares = Object.entries(mix)
    .filter(([, s]) => Number.isFinite(s) && s > 0)
    .sort((a, b) => b[1] - a[1])
    .map(([f, s]) => `${formatLabel(f)}: ${Math.round(s * 100)}%`)
    .join(" · ");
  return shares ? `${shares}. ${FORMAT_MIX_FORMULA}` : FORMAT_MIX_FORMULA;
}

export type CampaignFormatFields = {
  primaryFormat?: AdFormat;
  displayFormat?: DisplayFormat;
  formatMix?: Record<AdFormat, number>;
  creativeCount?: number;
};

/** Extract campaign format rollup fields from a raw API campaign object. */
export function pickCampaignFormatFields(raw: Record<string, unknown>): CampaignFormatFields {
  const primaryFormat = normalizeAdFormat(raw.primaryFormat ?? raw.primary_format);
  const displayFormat = normalizeDisplayFormat(
    raw.displayFormat ?? raw.display_format,
    primaryFormat,
  );
  const formatMix = normalizeFormatMix(raw.formatMix ?? raw.format_mix);
  const creativeRaw = raw.creativeCount ?? raw.creative_count;
  const creativeCount =
    creativeRaw != null && creativeRaw !== "" && Number.isFinite(Number(creativeRaw))
      ? Number(creativeRaw)
      : undefined;
  return {
    ...(primaryFormat ? { primaryFormat } : {}),
    ...(displayFormat ? { displayFormat } : {}),
    ...(formatMix ? { formatMix } : {}),
    ...(creativeCount != null ? { creativeCount } : {}),
  };
}
