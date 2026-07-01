import assert from "node:assert/strict";
import { corePages } from "@tenants/core/pages";
import { BLOCK_TYPES } from "@/collections/_blocks";

const blocks = new Set(BLOCK_TYPES);
const datasetKeys = new Set<string>();

for (const page of corePages) {
  for (const block of page.layout ?? []) {
    const blockType = (block as { blockType?: string }).blockType || "";
    assert.ok(blocks.has(blockType), `unknown block type in corePages: ${blockType}`);

    const dataset = (block as { dataset?: string }).dataset;
    if (typeof dataset === "string") datasetKeys.add(dataset);

    const cards = (block as { cards?: Array<{ dataset?: string }> }).cards;
    if (Array.isArray(cards)) {
      for (const card of cards) {
        if (typeof card.dataset === "string") datasetKeys.add(card.dataset);
      }
    }
  }
}

const expected = [
  "core.inteligencia.campaigns",
  "core.inteligencia.leads_at_risk",
  "core.leah.kpis",
  "core.qara.distribution",
];

for (const key of expected) {
  assert.ok(datasetKeys.has(key) || key.includes("count:") || key.includes("list:"), `expected dataset key not referenced by pages: ${key}`);
}

console.log("blocks-datasets.self-check ok");

