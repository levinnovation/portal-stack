import assert from "node:assert/strict";
import { parseInlineDatasetKey } from "./parse-inline";

assert.deepEqual(parseInlineDatasetKey("count:projects"), { kind: "count", collection: "projects" });
assert.deepEqual(parseInlineDatasetKey("sum:payments.amount"), {
  kind: "sum",
  collection: "payments",
  field: "amount",
});
assert.equal(parseInlineDatasetKey("bad"), null);

console.log("parse-inline.self-check ok");
