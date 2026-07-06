import type { CollectionSlug } from "payload";
import type { DatasetHandler } from "./index";

/** Demo custom handler: count docs in a Payload collection from query.collection. */
export const payloadCountHandler: DatasetHandler = async (payload, _ctx, query) => {
  const collection = String(query?.collection || "projects") as CollectionSlug;
  const r = await payload.find({ collection, limit: 0, depth: 0, overrideAccess: true });
  return r.totalDocs;
};
