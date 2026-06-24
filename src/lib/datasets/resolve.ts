/**
 * Resolves all datasets used by a Page's blocks, returning a map
 * { [datasetKey]: result } that the BlockRenderer injects into each block.
 *
 * Block components reference datasets by their key (e.g. "count:projects").
 * This function scans the page layout, collects unique dataset keys, and
 * runs them through the dataset runner.
 */
import "server-only";
import type { Payload } from "payload";
import { runDataset, type DatasetDef, type DatasetResult } from "./runner";

interface BlockLike {
  blockType: string;
  [k: string]: any;
}

function collectDatasetKeysFromBlock(block: BlockLike): string[] {
  const keys: string[] = [];
  if (block.dataset) keys.push(block.dataset);
  if (Array.isArray(block.cards)) {
    block.cards.forEach((c: any) => { if (c.dataset) keys.push(c.dataset); });
  }
  return Array.from(new Set(keys));
}

export async function resolvePageDatasets(
  payload: Payload,
  layout: BlockLike[],
  ctx?: { user?: { id: string; role: string } },
): Promise<Record<string, DatasetResult>> {
  const keys = Array.from(new Set(layout.flatMap(collectDatasetKeysKeys => collectDatasetKeysFromBlock(collectDatasetKeysKeys))));
  if (keys.length === 0) return {};

  const out: Record<string, DatasetResult> = {};
  await Promise.all(
    keys.map(async (key) => {
      // Datasets can be inline in the page block (via "dataset" prop = key) OR
      // looked up from the Datasets collection. For inline we build a minimal
      // dataset def: list with no extra config — handled at the runner.
      // Here we support inline (key = "<kind>:<col>") and registry lookup.
      if (key.includes(":")) {
        const [kind, collection] = key.split(":");
        const def: DatasetDef = { key, query: { kind: kind as any, collection } };
        try {
          out[key] = await runDataset(payload, def, ctx);
        } catch (e) {
          out[key] = null;
        }
        return;
      }
      try {
        const found = await payload.find({
          collection: "datasets",
          where: { key: { equals: key } },
          limit: 1,
          depth: 0,
          overrideAccess: true,
        });
        if (found.docs[0]) {
          out[key] = await runDataset(payload, found.docs[0] as any, ctx);
        }
      } catch {
        out[key] = null;
      }
    }),
  );
  return out;
}
