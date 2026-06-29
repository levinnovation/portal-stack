import assert from "node:assert/strict";

import { crcToUsd } from "@tenants/core/lib/fx";

// ₡512,000 at 512 ₡/USD → $1,000.
assert.equal(crcToUsd(512_000, 512), 1000);
// Guard: a non-positive rate must not divide-by-zero / flip sign.
assert.equal(crcToUsd(512_000, 0), 512_000);
assert.equal(crcToUsd(Number.NaN, 512), 0);

console.log("fx.self-check ok");
