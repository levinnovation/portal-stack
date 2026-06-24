/**
 * Dataset runner. Executes a query described by a Datasets collection
 * record against Payload and returns the result in a shape blocks can use.
 *
 * Supported kinds: count, sum, avg, list, monthly, custom (via handler).
 *
 * This module is intentionally side-effect free: it receives a Payload
 * instance and a dataset record, and returns a typed result. The page
 * server component collects the results for every dataset used by the
 * page's blocks before rendering.
 */

import type { Payload } from "payload";

export interface DatasetQuery {
  kind: "count" | "sum" | "avg" | "list" | "monthly" | "custom";
  collection?: string;
  field?: string;
  where?: any;
  limit?: number;
  sort?: string;
  handler?: string;
}

export interface DatasetDef {
  key: string;
  query: DatasetQuery;
}

export type DatasetResult = number | string | Record<string, unknown>[] | Record<string, unknown> | null;

export async function runDataset(payload: Payload, def: DatasetDef, ctx?: { user?: { id: string; role: string } }): Promise<DatasetResult> {
  const { query } = def;
  const where = await applyUserScope(query.where, ctx);

  // ponytail: custom handlers are not yet in use. To enable, add a
  // ./handlers/<name>.ts file (see loadHandler at the bottom of this file)
  // and uncomment the block below. Left disabled so webpack doesn't try
  // to resolve a non-existent dynamic import.
  /*
  if (query.kind === "custom" && query.handler) {
    const handler = await loadHandler(query.handler);
    if (handler) return handler(payload, ctx);
  }
  */

  if (!query.collection) {
    throw new Error(`Dataset ${def.key} has no collection`);
  }

  if (query.kind === "count") {
    const r = await payload.find({ collection: query.collection, where, limit: 0, depth: 0, overrideAccess: true });
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
      collection: query.collection,
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
    const r = await payload.find({ collection, where, limit: pageSize, page, depth: 0, overrideAccess: true });
    all.push(...r.docs);
    if (all.length >= r.totalDocs || r.docs.length < pageSize) break;
    page += 1;
    if (page > 50) break; // safety
  }
  return all;
}

async function applyUserScope(where: any, ctx?: { user?: { id: string; role: string } }) {
  if (!ctx?.user) return where;
  if (ctx.user.role === "admin" || ctx.user.role === "superadmin") return where;
  // Restrict non-admins to their own data where the convention is a `user` relation field.
  // Tenants can extend by passing their own where.
  return where ? { and: [where, { user: { equals: ctx.user.id } }] } : { user: { equals: ctx.user.id } };
}

type Handler = (payload: Payload, ctx?: { user?: { id: string; role: string } }) => Promise<DatasetResult>;

async function loadHandler(name: string): Promise<Handler | null> {
  try {
    const mod = await import(`./handlers/${name}.js`);
    return (mod as any).default ?? (mod as any).handler ?? null;
  } catch {
    return null;
  }
}
