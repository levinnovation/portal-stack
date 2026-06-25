/**
 * Resolves all datasets used by a Page's blocks, returning a map
 * { [datasetKey]: result } that the BlockRenderer injects into each block.
 */
import "server-only";
import type { Payload } from "payload";
import { isVerticalEnabled } from "@/lib/tenant";
import { parseInlineDatasetKey } from "./parse-inline";
import { runDataset, type DatasetDef, type DatasetResult } from "./runner";

interface BlockLike {
  blockType: string;
  [k: string]: any;
}

function collectDatasetKeysFromBlock(block: BlockLike): string[] {
  const keys: string[] = [];
  if (block.dataset) keys.push(typeof block.dataset === "object" ? block.dataset.key || block.dataset : block.dataset);
  if (Array.isArray(block.cards)) {
    block.cards.forEach((c: any) => {
      if (c.dataset) keys.push(typeof c.dataset === "object" ? c.dataset.key || c.dataset : c.dataset);
    });
  }
  return keys.filter(Boolean);
}

function inlineDef(key: string): DatasetDef | null {
  const parsed = parseInlineDatasetKey(key);
  if (!parsed) return null;
  return { key, query: { kind: parsed.kind, collection: parsed.collection, field: parsed.field } };
}

export async function resolvePageDatasets(
  payload: Payload,
  layout: BlockLike[],
  ctx?: { user?: { id: string; role: string } },
): Promise<Record<string, DatasetResult>> {
  const keys = Array.from(new Set(layout.flatMap(collectDatasetKeysFromBlock)));
  if (keys.length === 0) return {};

  const out: Record<string, DatasetResult> = {};
  await Promise.all(
    keys.map(async (key) => {
      const inline = inlineDef(key);
      if (inline) {
        try {
          out[key] = await runDataset(payload, inline, ctx);
        } catch {
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
        const doc = found.docs[0] as any;
        if (!doc) return;
        const vertical = doc.vertical || "generic";
        if (vertical !== "generic" && !(await isVerticalEnabled(vertical))) return;
        out[key] = await runDataset(payload, { key: doc.key, query: doc.query }, ctx);
      } catch {
        out[key] = null;
      }
    }),
  );
  return out;
}
