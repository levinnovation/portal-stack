import type { DatasetQuery } from "./runner";

/** Parse inline keys like count:projects or sum:payments.amount */
export function parseInlineDatasetKey(key: string): { kind: DatasetQuery["kind"]; collection: string; field?: string } | null {
  const colon = key.indexOf(":");
  if (colon < 1) return null;
  const kind = key.slice(0, colon) as DatasetQuery["kind"];
  const rest = key.slice(colon + 1);
  const dot = rest.indexOf(".");
  if (dot > 0) return { kind, collection: rest.slice(0, dot), field: rest.slice(dot + 1) };
  return { kind, collection: rest };
}
