// Daily CRC↔USD exchange rate.
//
// CORE's Meta Ads account is billed in colones, so the raw per-ad/post spend
// from the /posts feed arrives in CRC and must be shown in USD. We pull the
// rate once a day from a free, key-less FX endpoint (cached via Next's data
// cache for 24h) and fall back to a recent constant if the network/API is down.
//
// ponytail: FALLBACK_CRC_PER_USD is a static snapshot — if the API stays
// unreachable the converted figures drift from the real rate. Upgrade path is a
// scheduled job persisting the daily rate; a 24h-revalidated fetch is enough now.
const FALLBACK_CRC_PER_USD = 512;

const FX_ENDPOINT = "https://open.er-api.com/v6/latest/USD";

/** Colones per 1 USD, refreshed at most once per day. Never throws. */
export async function getCrcPerUsd(): Promise<number> {
  try {
    const res = await fetch(FX_ENDPOINT, { next: { revalidate: 86400 } });
    if (!res.ok) return FALLBACK_CRC_PER_USD;
    const json = (await res.json()) as { rates?: { CRC?: number } };
    const rate = json.rates?.CRC;
    return typeof rate === "number" && rate > 0 ? rate : FALLBACK_CRC_PER_USD;
  } catch {
    return FALLBACK_CRC_PER_USD;
  }
}

/** Convert a CRC-native amount to USD. Pass only values stored in colones. */
export function crcToUsd(crc: number, crcPerUsd: number): number {
  if (!isFinite(crc)) return 0;
  return crcPerUsd > 0 ? crc / crcPerUsd : crc;
}
