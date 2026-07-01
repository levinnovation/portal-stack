/**
 * Dataset runner. Executes a query described by a Datasets collection
 * record against Payload and returns the result in a shape blocks can use.
 *
 * Supported kinds: count, sum, avg, list, monthly, custom, http.
 */

import type { CollectionSlug, Payload } from "payload";
import { getDatasetHandler } from "./handlers";

export interface DatasetQuery {
  kind: "count" | "sum" | "avg" | "list" | "monthly" | "custom" | "http";
  collection?: string;
  field?: string;
  where?: any;
  limit?: number;
  sort?: string;
  handler?: string;
  /** http kind */
  url?: string;
  jsonPath?: string;
  tokenSource?: string;
  method?: "GET" | "POST";
}

export interface DatasetDef {
  key: string;
  query: DatasetQuery;
}

export interface DatasetContext {
  user?: { id: string; role: string };
  params?: Record<string, string | undefined>;
}

export type DatasetResult = number | string | Record<string, unknown>[] | Record<string, unknown> | null;

export async function runDataset(payload: Payload, def: DatasetDef, ctx?: DatasetContext): Promise<DatasetResult> {
  const { query } = def;

  if (query.kind === "custom" && query.handler) {
    const handler = getDatasetHandler(query.handler);
    if (!handler) throw new Error(`Unknown dataset handler: ${query.handler}`);
    return handler(payload, ctx, query as unknown as Record<string, unknown>);
  }

  if (query.kind === "http") {
    const handler = getDatasetHandler("rest-json");
    if (!handler) throw new Error("rest-json handler missing");
    return handler(payload, ctx, {
      url: query.url,
      jsonPath: query.jsonPath,
      tokenSource: query.tokenSource,
    });
  }

  const where = await applyUserScope(query.where, ctx);

  if (!query.collection) {
    throw new Error(`Dataset ${def.key} has no collection`);
  }

  if (query.kind === "count") {
    const r = await payload.find({ collection: query.collection as CollectionSlug, where, limit: 0, depth: 0, overrideAccess: true });
    return r.totalDocs;
  }

  if (query.kind === "sum" || query.kind === "avg") {
    const docs = await fetchAllFor(payload, query.collection, where);
    if (!query.field) throw new Error(`Dataset ${def.key} (${query.kind}) needs a field`);
    const nums = docs.map((d: any) => Number(d[query.field!] || 0));
    if (query.kind === "sum") return nums.reduce((a, b) => a + b, 0);
    return nums.length ? nums.reduce((a, b) => a + b, 0) / nums.length : 0;
  }

  if (query.kind === "list") {
    const r = await payload.find({
      collection: query.collection as CollectionSlug,
      where,
      limit: query.limit ?? 10,
      sort: query.sort,
      depth: 1,
      overrideAccess: true,
    });
    return r.docs as any[];
  }

  if (query.kind === "monthly") {
    const docs = await fetchAllFor(payload, query.collection, where);
    const dateField = query.field || "createdAt";
    const valueField = query.field && query.field !== dateField ? query.field : "amount";
    const buckets: Record<string, number> = {};
    docs.forEach((d: any) => {
      const date = new Date(d[dateField]);
      const key = date.toLocaleDateString("en-US", { year: "2-digit", month: "short" });
      buckets[key] = (buckets[key] || 0) + Number(d[valueField] || 0);
    });
    return Object.entries(buckets).map(([name, value]) => ({ name, value }));
  }

  return null;
}

async function fetchAllFor(payload: Payload, collection: string, where?: any) {
  const all: any[] = [];
  let page = 1;
  const pageSize = 200;
  while (true) {
    const r = await payload.find({ collection: collection as CollectionSlug, where, limit: pageSize, page, depth: 0, overrideAccess: true });
    all.push(...r.docs);
    if (all.length >= r.totalDocs || r.docs.length < pageSize) break;
    page += 1;
    if (page > 50) break;
  }
  return all;
}

async function applyUserScope(where: any, ctx?: DatasetContext) {
  if (!ctx?.user) return where;
  if (ctx.user.role === "admin" || ctx.user.role === "superadmin") return where;
  return where ? { and: [where, { user: { equals: ctx.user.id } }] } : { user: { equals: ctx.user.id } };
}
