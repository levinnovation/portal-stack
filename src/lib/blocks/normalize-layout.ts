import { BLOCK_TYPES } from "@/collections/_blocks";

/** Flatten Payload admin group-array rows into { blockType, ...props } for BlockRenderer. */
export function normalizeLayout(layout: unknown[]): unknown[] {
  if (!Array.isArray(layout)) return [];
  return layout.map(normalizeBlock).filter(Boolean);
}

function normalizeBlock(raw: unknown): Record<string, unknown> | null {
  if (!raw || typeof raw !== "object") return null;
  const block = raw as Record<string, unknown>;
  if (typeof block.blockType === "string") {
    const { blockType, ...rest } = block;
    return { blockType, ...rest };
  }
  for (const type of BLOCK_TYPES) {
    const nested = block[type];
    if (nested && typeof nested === "object") {
      return { blockType: type, ...(nested as Record<string, unknown>) };
    }
  }
  return null;
}
