import assert from "node:assert/strict";
import { normalizeLayout } from "./normalize-layout";

const flat = normalizeLayout([{ blockType: "divider", size: "md" }]);
assert.equal((flat[0] as any).blockType, "divider");

const grouped = normalizeLayout([{ "kpi-grid": { title: "KPIs", cards: [] } }]);
assert.equal((grouped[0] as any).blockType, "kpi-grid");
assert.equal((grouped[0] as any).title, "KPIs");

console.log("normalize-layout.self-check ok");
